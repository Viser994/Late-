from __future__ import annotations

import logging
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from src.config import DEFAULT_CONFIG_PATH, load_config, save_config
from src.scanner import TSXScanner

logger = logging.getLogger(__name__)


class TSXScannerApp:
    """Desktop GUI for the TSX Stock Scanner."""

    COLUMNS = (
        ("rank", "Rank", 50),
        ("ticker", "Ticker", 70),
        ("company_name", "Company", 220),
        ("current_price", "Price", 80),
        ("score", "Score", 70),
        ("pe_ratio", "P/E", 70),
        ("roe", "ROE", 70),
        ("revenue_growth", "Rev Growth", 90),
        ("dividend_yield", "Div Yield", 80),
        ("sector", "Sector", 120),
        ("data_source", "Source", 100),
    )

    def __init__(self, root: tk.Tk, config_path: Path | None = None) -> None:
        self.root = root
        self.config_path = config_path or DEFAULT_CONFIG_PATH
        self.config = load_config(self.config_path)
        self.scanner = TSXScanner(self.config)
        self.results: list = []
        self._scan_thread: threading.Thread | None = None

        self.root.title("TSX Stock Scanner")
        self.root.geometry("1200x700")
        self.root.minsize(900, 500)

        self._build_ui()
        self._load_cached_results()

    def _build_ui(self) -> None:
        toolbar = ttk.Frame(self.root, padding=8)
        toolbar.pack(fill=tk.X)

        ttk.Button(toolbar, text="Scan All", command=self.start_scan).pack(side=tk.LEFT, padx=4)
        ttk.Button(toolbar, text="Refresh Universe", command=self.refresh_universe).pack(side=tk.LEFT, padx=4)
        ttk.Button(toolbar, text="Load Cached", command=self._load_cached_results).pack(side=tk.LEFT, padx=4)
        ttk.Button(toolbar, text="Export CSV", command=self.export_csv).pack(side=tk.LEFT, padx=4)
        ttk.Button(toolbar, text="Export Excel", command=self.export_excel).pack(side=tk.LEFT, padx=4)
        ttk.Button(toolbar, text="Settings", command=self.open_settings).pack(side=tk.LEFT, padx=4)

        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(toolbar, textvariable=self.status_var).pack(side=tk.RIGHT, padx=8)

        filter_frame = ttk.Frame(self.root, padding=(8, 0))
        filter_frame.pack(fill=tk.X)
        ttk.Label(filter_frame, text="Search:").pack(side=tk.LEFT)
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._apply_filter())
        ttk.Entry(filter_frame, textvariable=self.search_var, width=30).pack(side=tk.LEFT, padx=6)

        self.progress = ttk.Progressbar(self.root, mode="determinate")
        self.progress.pack(fill=tk.X, padx=8, pady=4)

        table_frame = ttk.Frame(self.root, padding=8)
        table_frame.pack(fill=tk.BOTH, expand=True)

        col_ids = [c[0] for c in self.COLUMNS]
        self.tree = ttk.Treeview(table_frame, columns=col_ids, show="headings", selectmode="browse")

        for col_id, heading, width in self.COLUMNS:
            self.tree.heading(col_id, text=heading, command=lambda c=col_id: self._sort_by(c))
            self.tree.column(col_id, width=width, anchor=tk.CENTER if col_id != "company_name" else tk.W)

        vsb = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        hsb = ttk.Scrollbar(table_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        self.tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")
        table_frame.rowconfigure(0, weight=1)
        table_frame.columnconfigure(0, weight=1)

        detail_frame = ttk.LabelFrame(self.root, text="Score Breakdown", padding=8)
        detail_frame.pack(fill=tk.X, padx=8, pady=4)
        self.detail_var = tk.StringVar(value="Select a stock to view score details.")
        ttk.Label(detail_frame, textvariable=self.detail_var, wraplength=1100).pack(anchor=tk.W)

        self.tree.bind("<<TreeviewSelect>>", self._on_select)

    def _format_cell(self, key: str, value) -> str:
        if value is None:
            return ""
        if key == "current_price":
            return f"${float(value):,.2f}"
        if key in {"score", "pe_ratio", "roe", "revenue_growth", "dividend_yield"}:
            if key in {"revenue_growth", "dividend_yield", "roe"}:
                display = float(value) * 100 if abs(float(value)) <= 1 else float(value)
                return f"{display:.2f}%"
            return f"{float(value):.2f}"
        if key == "market_cap" and value:
            return f"{float(value):,.0f}"
        return str(value)

    def _populate_table(self, results: list) -> None:
        self.tree.delete(*self.tree.get_children())
        for stock in results:
            row = {k: getattr(stock, k, None) for k, _, _ in self.COLUMNS}
            values = [self._format_cell(k, row[k]) for k, _, _ in self.COLUMNS]
            self.tree.insert("", tk.END, iid=stock.ticker, values=values)

    def _apply_filter(self) -> None:
        query = self.search_var.get().strip().lower()
        if not query:
            self._populate_table(self.results)
            return
        filtered = [
            s
            for s in self.results
            if query in s.ticker.lower() or query in (s.company_name or "").lower()
        ]
        self._populate_table(filtered)

    def _sort_by(self, column: str) -> None:
        if not self.results:
            return
        reverse = getattr(self, f"_sort_{column}_reverse", False)

        def sort_key(stock):
            val = getattr(stock, column, None)
            if val is None:
                return float("-inf") if reverse else float("inf")
            return val

        self.results = sorted(self.results, key=sort_key, reverse=not reverse)
        setattr(self, f"_sort_{column}_reverse", not reverse)
        self._apply_filter()

    def _on_select(self, _event=None) -> None:
        selected = self.tree.selection()
        if not selected:
            return
        ticker = selected[0]
        stock = next((s for s in self.results if s.ticker == ticker), None)
        if not stock:
            return
        breakdown = stock.score_breakdown or {}
        self.detail_var.set(
            f"{stock.company_name} ({stock.ticker}) — "
            f"Composite: {stock.score:.2f} | "
            f"Value: {breakdown.get('value', 0):.1f} | "
            f"Quality: {breakdown.get('quality', 0):.1f} | "
            f"Growth: {breakdown.get('growth', 0):.1f} | "
            f"Health: {breakdown.get('financial_health', 0):.1f} | "
            f"Source: {stock.data_source}"
        )

    def _load_cached_results(self) -> None:
        cached = self.scanner.load_cached_results()
        if cached:
            self.results = cached
            self._populate_table(self.results)
            self.status_var.set(f"Loaded {len(cached)} cached results")

    def refresh_universe(self) -> None:
        self.status_var.set("Refreshing TSX universe...")
        self.root.update_idletasks()
        try:
            tickers = self.scanner.refresh_universe()
            messagebox.showinfo("Universe Updated", f"Loaded {len(tickers)} common shares.")
            self.status_var.set(f"Universe: {len(tickers)} tickers")
        except Exception as exc:
            messagebox.showerror("Error", str(exc))
            self.status_var.set("Universe refresh failed")

    def start_scan(self) -> None:
        if self._scan_thread and self._scan_thread.is_alive():
            messagebox.showwarning("Scan in Progress", "A scan is already running.")
            return

        self.status_var.set("Starting scan...")
        self.progress["value"] = 0
        self._scan_thread = threading.Thread(target=self._run_scan, daemon=True)
        self._scan_thread.start()

    def _run_scan(self) -> None:
        try:
            tickers = self.scanner.load_universe()

            def progress(done: int, total: int, ticker: str) -> None:
                pct = (done / total) * 100 if total else 0
                self.root.after(
                    0,
                    lambda: (
                        self.progress.configure(value=pct),
                        self.status_var.set(f"Scanning {done}/{total}: {ticker}"),
                    ),
                )

            results = self.scanner.scan(tickers=tickers, progress_callback=progress)
            self.root.after(0, lambda: self._on_scan_complete(results))
        except Exception as exc:
            self.root.after(0, lambda: messagebox.showerror("Scan Error", str(exc)))
            self.root.after(0, lambda: self.status_var.set("Scan failed"))

    def _on_scan_complete(self, results: list) -> None:
        self.results = results
        self._populate_table(results)
        self.progress["value"] = 100
        self.status_var.set(f"Scan complete: {len(results)} stocks ranked")
        messagebox.showinfo("Scan Complete", f"Ranked {len(results)} TSX stocks.")

    def export_csv(self) -> None:
        if not self.results:
            messagebox.showwarning("No Data", "Run a scan first.")
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv")],
        )
        if path:
            self.scanner.export_csv(self.results, Path(path))
            messagebox.showinfo("Exported", f"Saved to {path}")

    def export_excel(self) -> None:
        if not self.results:
            messagebox.showwarning("No Data", "Run a scan first.")
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".xlsx",
            filetypes=[("Excel files", "*.xlsx")],
        )
        if path:
            self.scanner.export_excel(self.results, Path(path))
            messagebox.showinfo("Exported", f"Saved to {path}")

    def open_settings(self) -> None:
        dialog = tk.Toplevel(self.root)
        dialog.title("API Settings")
        dialog.geometry("500x280")
        dialog.transient(self.root)
        dialog.grab_set()

        keys = self.config.get("api_keys", {})
        entries: dict[str, tk.Entry] = {}

        ttk.Label(dialog, text="Enter API keys (saved to config.json):").pack(pady=8)
        form = ttk.Frame(dialog, padding=12)
        form.pack(fill=tk.BOTH, expand=True)

        for idx, (label, key) in enumerate(
            [
                ("FinancialModelingPrep", "financialmodelingprep"),
                ("Finnhub", "finnhub"),
                ("Alpha Vantage", "alpha_vantage"),
            ]
        ):
            ttk.Label(form, text=f"{label}:").grid(row=idx, column=0, sticky=tk.W, pady=4)
            entry = ttk.Entry(form, width=45, show="*")
            entry.insert(0, keys.get(key, ""))
            entry.grid(row=idx, column=1, pady=4, padx=6)
            entries[key] = entry

        def save_keys() -> None:
            for key, entry in entries.items():
                self.config.setdefault("api_keys", {})[key] = entry.get().strip()
            save_config(self.config, self.config_path)
            self.scanner = TSXScanner(self.config)
            messagebox.showinfo("Saved", f"Settings saved to {self.config_path}")
            dialog.destroy()

        ttk.Button(dialog, text="Save", command=save_keys).pack(pady=8)


def run_gui(config_path: Path | None = None) -> None:
    root = tk.Tk()
    style = ttk.Style()
    if "clam" in style.theme_names():
        style.theme_use("clam")
    TSXScannerApp(root, config_path)
    root.mainloop()
