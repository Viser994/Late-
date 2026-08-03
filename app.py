"""Desktop UI for TSX stock scanning and ranking."""

from __future__ import annotations

import csv
import datetime as dt
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from config import DEFAULT_CONFIG_PATH, load_config
from providers import ProviderRouter
from scanner import StockScanner
from universe import UniverseManager


class TSXScannerApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("TSX Fundamentals Scanner")
        self.root.geometry("1300x760")
        self.root.minsize(1100, 640)

        self.config_path = DEFAULT_CONFIG_PATH
        self.config = None
        self.provider_router = None
        self.universe_manager = None
        self.scanner = None
        self.universe = []
        self.results = []
        self.sort_reverse = True

        self.status_var = tk.StringVar(value="Load config.json to begin.")
        self.progress_var = tk.DoubleVar(value=0.0)
        self.filter_var = tk.StringVar(value="")

        self._build_ui()

    def _build_ui(self) -> None:
        control = ttk.Frame(self.root, padding=10)
        control.pack(fill="x")

        ttk.Button(control, text="Load Config", command=self.load_app_config).pack(side="left")
        ttk.Button(control, text="Update TSX Universe", command=self.update_universe).pack(
            side="left", padx=(8, 0)
        )
        ttk.Button(control, text="Run Full Scan", command=self.run_scan).pack(side="left", padx=(8, 0))
        ttk.Button(control, text="Export CSV", command=self.export_csv).pack(side="left", padx=(8, 0))

        ttk.Label(control, text="Filter:").pack(side="left", padx=(22, 4))
        filter_box = ttk.Entry(control, textvariable=self.filter_var, width=28)
        filter_box.pack(side="left")
        filter_box.bind("<KeyRelease>", lambda _: self.refresh_table())

        ttk.Label(self.root, textvariable=self.status_var, padding=(10, 4)).pack(fill="x")
        ttk.Progressbar(self.root, variable=self.progress_var, maximum=100.0).pack(fill="x", padx=10)

        cols = (
            "rank",
            "symbol",
            "company_name",
            "score",
            "price",
            "market_cap",
            "pe_ratio",
            "pb_ratio",
            "roe",
            "profit_margin",
            "debt_to_equity",
            "revenue_growth",
            "source",
        )
        self.table = ttk.Treeview(self.root, columns=cols, show="headings")
        for col in cols:
            self.table.heading(col, text=col, command=lambda c=col: self.sort_by(c))
            width = 92
            if col in {"company_name"}:
                width = 300
            elif col in {"symbol", "rank", "source"}:
                width = 90
            self.table.column(col, width=width, anchor="center")
        self.table.column("company_name", anchor="w")

        scroll_y = ttk.Scrollbar(self.root, orient="vertical", command=self.table.yview)
        self.table.configure(yscroll=scroll_y.set)
        self.table.pack(side="left", fill="both", expand=True, padx=(10, 0), pady=10)
        scroll_y.pack(side="right", fill="y", pady=10, padx=(0, 10))

    def load_app_config(self) -> None:
        try:
            self.config = load_config(self.config_path)
            self.provider_router = ProviderRouter(self.config)
            self.universe_manager = UniverseManager(self.provider_router, self.config.universe_path)
            self.scanner = StockScanner(self.provider_router, self.config.max_workers)
            cached = self.universe_manager.load_cached()
            self.universe = cached
            self.status_var.set(
                f"Config loaded. Cached universe entries: {len(cached)} from {self.config.universe_path}"
            )
        except Exception as exc:  # noqa: BLE001
            messagebox.showerror("Config Error", str(exc))
            self.status_var.set("Failed to load config.")

    def update_universe(self) -> None:
        if not self.universe_manager:
            messagebox.showwarning("Missing Config", "Load config first.")
            return
        self._run_worker("Updating TSX common share universe...", self._update_universe_worker)

    def _update_universe_worker(self) -> None:
        listings = self.universe_manager.refresh()
        self.universe = listings
        self.progress_var.set(100.0)
        self.status_var.set(f"Universe updated: {len(listings)} common-share TSX listings.")

    def run_scan(self) -> None:
        if not self.scanner or not self.universe_manager:
            messagebox.showwarning("Missing Config", "Load config first.")
            return
        if not self.universe:
            self.universe = self.universe_manager.load_cached()
        if not self.universe:
            messagebox.showwarning("Missing Universe", "Update the TSX universe first.")
            return
        self._run_worker("Scanning TSX stocks...", self._scan_worker)

    def _scan_worker(self) -> None:
        listings = self.universe
        if self.config and self.config.max_symbols > 0:
            listings = listings[: self.config.max_symbols]

        def on_progress(done: int, total: int, symbol: str) -> None:
            pct = (done / total) * 100 if total else 0
            self.root.after(
                0,
                lambda: (
                    self.progress_var.set(pct),
                    self.status_var.set(f"Scanning {done}/{total}: {symbol}"),
                ),
            )

        results = self.scanner.scan(listings, progress_callback=on_progress)
        self.results = results
        self.root.after(0, self.refresh_table)
        self.progress_var.set(100.0)
        self.status_var.set(f"Scan complete. Ranked {len(results)} stocks.")

    def _run_worker(self, status_message: str, callback) -> None:  # type: ignore[no-untyped-def]
        self.status_var.set(status_message)
        self.progress_var.set(0.0)

        def runner() -> None:
            try:
                callback()
            except Exception as exc:  # noqa: BLE001
                self.root.after(
                    0,
                    lambda: (
                        messagebox.showerror("Operation failed", str(exc)),
                        self.status_var.set(f"Operation failed: {exc}"),
                    ),
                )

        thread = threading.Thread(target=runner, daemon=True)
        thread.start()

    def refresh_table(self) -> None:
        for row_id in self.table.get_children():
            self.table.delete(row_id)
        query = self.filter_var.get().strip().lower()

        rows = self.results
        if query:
            rows = [
                row
                for row in rows
                if query in row.symbol.lower() or query in row.company_name.lower()
            ]

        for rank, row in enumerate(rows, start=1):
            self.table.insert(
                "",
                "end",
                values=(
                    rank,
                    row.symbol,
                    row.company_name,
                    f"{row.score:.2f}",
                    self._fmt(row.price),
                    self._fmt(row.market_cap),
                    self._fmt(row.pe_ratio),
                    self._fmt(row.pb_ratio),
                    self._fmt(row.roe),
                    self._fmt(row.profit_margin),
                    self._fmt(row.debt_to_equity),
                    self._fmt(row.revenue_growth),
                    row.source,
                ),
            )

    def sort_by(self, column: str) -> None:
        numeric_columns = {
            "rank",
            "score",
            "price",
            "market_cap",
            "pe_ratio",
            "pb_ratio",
            "roe",
            "profit_margin",
            "debt_to_equity",
            "revenue_growth",
        }
        self.sort_reverse = not self.sort_reverse
        if column == "rank":
            return

        if column in numeric_columns:
            self.results.sort(
                key=lambda row: self._sortable_number(getattr(row, column, None)),
                reverse=self.sort_reverse,
            )
        else:
            self.results.sort(
                key=lambda row: str(getattr(row, column, "")).lower(),
                reverse=self.sort_reverse,
            )
        self.refresh_table()

    def export_csv(self) -> None:
        if not self.results:
            messagebox.showwarning("No Results", "Run a scan first.")
            return
        default_name = f"tsx_rankings_{dt.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        path = filedialog.asksaveasfilename(
            title="Save ranked results",
            defaultextension=".csv",
            initialfile=default_name,
            filetypes=[("CSV Files", "*.csv")],
        )
        if not path:
            return
        headers = [
            "rank",
            "symbol",
            "company_name",
            "score",
            "price",
            "market_cap",
            "pe_ratio",
            "pb_ratio",
            "roe",
            "profit_margin",
            "debt_to_equity",
            "revenue_growth",
            "source",
            "errors",
        ]
        with Path(path).open("w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(headers)
            for idx, row in enumerate(self.results, start=1):
                writer.writerow(
                    [
                        idx,
                        row.symbol,
                        row.company_name,
                        row.score,
                        row.price,
                        row.market_cap,
                        row.pe_ratio,
                        row.pb_ratio,
                        row.roe,
                        row.profit_margin,
                        row.debt_to_equity,
                        row.revenue_growth,
                        row.source,
                        "; ".join(row.errors),
                    ]
                )
        self.status_var.set(f"Exported CSV: {path}")

    @staticmethod
    def _fmt(value) -> str:  # type: ignore[no-untyped-def]
        if value is None:
            return "-"
        if abs(value) >= 1_000_000_000:
            return f"{value / 1_000_000_000:.2f}B"
        if abs(value) >= 1_000_000:
            return f"{value / 1_000_000:.2f}M"
        if abs(value) >= 100:
            return f"{value:.2f}"
        return f"{value:.4f}"

    @staticmethod
    def _sortable_number(value) -> float:  # type: ignore[no-untyped-def]
        if value is None:
            return -1e18
        try:
            return float(value)
        except (TypeError, ValueError):
            return -1e18


def main() -> None:
    root = tk.Tk()
    TSXScannerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
