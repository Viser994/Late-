"""Interactive desktop GUI (Tkinter) for the TSX Stock Scanner.

Layout
------
  * Top toolbar   - Scan / Stop / Refresh universe / Export, quick settings.
  * Search bar    - live filter by ticker, company or sector.
  * Results table - sortable, ranked list of companies with key metrics.
  * Detail panel  - full breakdown for the selected company.
  * Status bar    - progress bar + rolling log.

The scan runs on a background thread; UI updates flow back through a queue so
the interface stays responsive and the scan can be stopped mid-flight.
"""

from __future__ import annotations

import queue
import threading
from pathlib import Path
from typing import Optional

import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from . import config as cfg
from . import scanner as scanner_mod
from .models import StockData


def human_money(value: Optional[float], currency: str = "") -> str:
    if value is None:
        return "-"
    suffix = f" {currency}".rstrip()
    for div, unit in ((1e12, "T"), (1e9, "B"), (1e6, "M"), (1e3, "K")):
        if abs(value) >= div:
            return f"{value / div:,.2f}{unit}{suffix}"
    return f"{value:,.0f}{suffix}"


def num(value: Optional[float], spec: str = ",.2f") -> str:
    if value is None:
        return "-"
    try:
        return format(value, spec)
    except (ValueError, TypeError):
        return str(value)


# (column id, heading, width, anchor, kind) - kind drives sorting/formatting.
COLUMNS = [
    ("rank", "#", 45, "center", "int"),
    ("ticker", "Ticker", 80, "w", "str"),
    ("name", "Company", 240, "w", "str"),
    ("sector", "Sector", 150, "w", "str"),
    ("price", "Price", 80, "e", "money"),
    ("score", "Score", 65, "e", "num"),
    ("value", "Value", 60, "e", "num"),
    ("quality", "Quality", 65, "e", "num"),
    ("growth", "Growth", 65, "e", "num"),
    ("health", "Health", 60, "e", "num"),
    ("income", "Income", 65, "e", "num"),
    ("momentum", "Mom.", 55, "e", "num"),
    ("pe_ratio", "P/E", 65, "e", "num"),
    ("dividend_yield", "Div %", 65, "e", "num"),
    ("market_cap", "Mkt Cap", 110, "e", "capmoney"),
]


class ScannerApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("TSX Stock Scanner")
        self.geometry("1280x760")
        self.minsize(1000, 600)

        self.config_obj = cfg.load_config()
        self.scanner = scanner_mod.Scanner(self.config_obj)

        self.results: list[StockData] = []
        self.display: list[StockData] = []
        self._queue: "queue.Queue[tuple]" = queue.Queue()
        self._worker: Optional[threading.Thread] = None
        self._stop_flag = threading.Event()
        self._sort_state: dict[str, bool] = {}

        self._build_style()
        self._build_toolbar()
        self._build_search()
        self._build_table()
        self._build_detail()
        self._build_statusbar()

        self._load_cached_scan()
        self.after(100, self._poll_queue)
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    # ------------------------------------------------------------------ UI
    def _build_style(self) -> None:
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("Treeview", rowheight=24, font=("Segoe UI", 9))
        style.configure("Treeview.Heading", font=("Segoe UI", 9, "bold"))
        style.configure("Toolbar.TButton", padding=6)

    def _build_toolbar(self) -> None:
        bar = ttk.Frame(self, padding=(8, 6))
        bar.pack(side="top", fill="x")

        self.scan_btn = ttk.Button(bar, text="\u25B6  Scan TSX", style="Toolbar.TButton", command=self.start_scan)
        self.scan_btn.pack(side="left")
        self.stop_btn = ttk.Button(bar, text="\u25A0  Stop", style="Toolbar.TButton", command=self.stop_scan, state="disabled")
        self.stop_btn.pack(side="left", padx=(6, 0))
        ttk.Button(bar, text="\u21BB  Refresh Universe", style="Toolbar.TButton", command=self.refresh_universe).pack(side="left", padx=(6, 0))
        ttk.Button(bar, text="\u2913  Export CSV", style="Toolbar.TButton", command=self.export_csv).pack(side="left", padx=(6, 0))

        ttk.Label(bar, text="Limit:").pack(side="left", padx=(18, 2))
        self.limit_var = tk.StringVar(value="")
        ttk.Entry(bar, textvariable=self.limit_var, width=7).pack(side="left")
        ttk.Label(bar, text="(blank = all)").pack(side="left", padx=(2, 0))

        providers = ", ".join(self.scanner.data_service.active_provider_names) or "none"
        self.provider_lbl = ttk.Label(bar, text=f"Providers: {providers}")
        self.provider_lbl.pack(side="right")

    def _build_search(self) -> None:
        frame = ttk.Frame(self, padding=(8, 0))
        frame.pack(side="top", fill="x")
        ttk.Label(frame, text="Filter:").pack(side="left")
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._apply_filter())
        entry = ttk.Entry(frame, textvariable=self.search_var, width=40)
        entry.pack(side="left", padx=(4, 0), pady=4)
        ttk.Label(frame, text="ticker / company / sector").pack(side="left", padx=(6, 0))
        self.count_lbl = ttk.Label(frame, text="")
        self.count_lbl.pack(side="right")

    def _build_table(self) -> None:
        container = ttk.Frame(self)
        container.pack(side="top", fill="both", expand=True, padx=8, pady=(4, 0))

        columns = [c[0] for c in COLUMNS]
        self.tree = ttk.Treeview(container, columns=columns, show="headings", selectmode="browse")
        for col_id, heading, width, anchor, _kind in COLUMNS:
            self.tree.heading(col_id, text=heading, command=lambda c=col_id: self._sort_by(c))
            self.tree.column(col_id, width=width, anchor=anchor, stretch=(col_id == "name"))

        vsb = ttk.Scrollbar(container, orient="vertical", command=self.tree.yview)
        hsb = ttk.Scrollbar(container, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
        self.tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")
        container.rowconfigure(0, weight=1)
        container.columnconfigure(0, weight=1)

        self.tree.tag_configure("top", background="#e8f5e9")
        self.tree.tag_configure("odd", background="#f7f7f7")
        self.tree.bind("<<TreeviewSelect>>", self._on_select)

    def _build_detail(self) -> None:
        frame = ttk.LabelFrame(self, text="Company detail", padding=8)
        frame.pack(side="top", fill="x", padx=8, pady=6)
        self.detail = tk.Text(frame, height=7, wrap="word", font=("Consolas", 9))
        self.detail.pack(side="left", fill="both", expand=True)
        self.detail.configure(state="disabled")

    def _build_statusbar(self) -> None:
        bar = ttk.Frame(self, padding=(8, 4))
        bar.pack(side="bottom", fill="x")
        self.progress = ttk.Progressbar(bar, mode="determinate", length=260)
        self.progress.pack(side="left")
        self.status_var = tk.StringVar(value="Ready.")
        ttk.Label(bar, textvariable=self.status_var).pack(side="left", padx=(10, 0))

    # -------------------------------------------------------------- actions
    def start_scan(self) -> None:
        if self._worker and self._worker.is_alive():
            return
        limit: Optional[int] = None
        raw = self.limit_var.get().strip()
        if raw:
            try:
                limit = max(1, int(raw))
            except ValueError:
                messagebox.showerror("Invalid limit", "Limit must be a whole number.")
                return

        self._stop_flag.clear()
        self.scan_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.progress.configure(value=0, maximum=100)
        self._set_status("Starting scan…")

        self._worker = threading.Thread(target=self._scan_worker, args=(limit,), daemon=True)
        self._worker.start()

    def stop_scan(self) -> None:
        self._stop_flag.set()
        self._set_status("Stopping…")

    def refresh_universe(self) -> None:
        if self._worker and self._worker.is_alive():
            messagebox.showinfo("Busy", "A scan is already running.")
            return
        self._set_status("Refreshing TSX universe…")

        def work() -> None:
            try:
                tickers = self.scanner.refresh_universe(log=self._log)
                self._queue.put(("log", f"Universe refreshed: {len(tickers)} common shares."))
                self._queue.put(("status", f"Universe: {len(tickers)} common shares."))
            except Exception as exc:  # noqa: BLE001
                self._queue.put(("error", f"Universe refresh failed: {exc}"))

        threading.Thread(target=work, daemon=True).start()

    def export_csv(self) -> None:
        if not self.results:
            messagebox.showinfo("Nothing to export", "Run a scan first.")
            return
        path = filedialog.asksaveasfilename(
            title="Export ranking",
            defaultextension=".csv",
            initialfile="tsx_ranking.csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
        )
        if not path:
            return
        scanner_mod.export_csv(self.results, Path(path))
        self._set_status(f"Exported {len(self.results)} rows to {path}")

    # ------------------------------------------------------------- worker
    def _scan_worker(self, limit: Optional[int]) -> None:
        def progress(done: int, total: int, ticker: str) -> None:
            self._queue.put(("progress", done, total, ticker))

        try:
            results = self.scanner.run(
                limit=limit,
                progress=progress,
                log=self._log,
                should_stop=self._stop_flag.is_set,
            )
            scanner_mod.save_scan(results)
            self._queue.put(("done", results))
        except Exception as exc:  # noqa: BLE001
            self._queue.put(("error", str(exc)))

    def _log(self, msg: str) -> None:
        self._queue.put(("log", msg))

    # -------------------------------------------------------- queue polling
    def _poll_queue(self) -> None:
        try:
            while True:
                item = self._queue.get_nowait()
                kind = item[0]
                if kind == "progress":
                    _, done, total, ticker = item
                    self.progress.configure(maximum=max(total, 1), value=done)
                    self._set_status(f"Scanning {done}/{total}  ({ticker})")
                elif kind == "log":
                    self._set_status(item[1])
                elif kind == "status":
                    self._set_status(item[1])
                elif kind == "done":
                    self._on_scan_done(item[1])
                elif kind == "error":
                    self._on_scan_error(item[1])
        except queue.Empty:
            pass
        self.after(100, self._poll_queue)

    def _on_scan_done(self, results: list[StockData]) -> None:
        self.results = results
        self.scan_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self._apply_filter()
        stopped = " (stopped early)" if self._stop_flag.is_set() else ""
        self._set_status(f"Done. Ranked {len(results)} companies{stopped}.")

    def _on_scan_error(self, msg: str) -> None:
        self.scan_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self._set_status(f"Error: {msg}")
        messagebox.showerror("Scan error", msg)

    # ------------------------------------------------------------- display
    def _load_cached_scan(self) -> None:
        results, created = scanner_mod.load_scan()
        if results:
            self.results = results
            self._apply_filter()
            self._set_status(f"Loaded {len(results)} companies from last scan.")

    def _apply_filter(self) -> None:
        term = self.search_var.get().strip().lower()
        if term:
            self.display = [
                s for s in self.results
                if term in s.ticker.lower()
                or term in (s.name or "").lower()
                or term in (s.sector or "").lower()
            ]
        else:
            self.display = list(self.results)
        self._populate_tree()

    def _populate_tree(self) -> None:
        self.tree.delete(*self.tree.get_children())
        for i, s in enumerate(self.display):
            tags = []
            if s.rank is not None and s.rank <= 10:
                tags.append("top")
            elif i % 2:
                tags.append("odd")
            self.tree.insert("", "end", iid=str(i), values=self._row_values(s), tags=tags)
        self.count_lbl.configure(text=f"{len(self.display)} shown / {len(self.results)} total")

    def _row_values(self, s: StockData) -> list[str]:
        subs = s.subscores or {}
        mapping = {
            "rank": s.rank if s.rank is not None else "",
            "ticker": s.ticker,
            "name": s.name or "",
            "sector": s.sector or "",
            "price": num(s.price),
            "score": num(s.score, ".2f"),
            "value": num(subs.get("value"), ".0f"),
            "quality": num(subs.get("quality"), ".0f"),
            "growth": num(subs.get("growth"), ".0f"),
            "health": num(subs.get("health"), ".0f"),
            "income": num(subs.get("income"), ".0f"),
            "momentum": num(subs.get("momentum"), ".0f"),
            "pe_ratio": num(s.pe_ratio, ".1f"),
            "dividend_yield": num(s.dividend_yield, ".2f"),
            "market_cap": human_money(s.market_cap),
        }
        return [mapping[c[0]] for c in COLUMNS]

    def _sort_by(self, col: str) -> None:
        ascending = not self._sort_state.get(col, False)
        self._sort_state[col] = ascending
        kind = next((c[4] for c in COLUMNS if c[0] == col), "str")

        def key(s: StockData):
            val = self._sort_key_value(s, col, kind)
            return val

        # None values always sort to the bottom.
        numeric = kind in ("int", "num", "money", "capmoney")
        sentinel = float("inf") if ascending else float("-inf")

        def sort_key(s: StockData):
            v = self._sort_key_value(s, col, kind)
            if v is None:
                return (1, sentinel) if numeric else (1, "")
            return (0, v)

        self.display.sort(key=sort_key, reverse=not ascending)
        self._populate_tree()

    def _sort_key_value(self, s: StockData, col: str, kind: str):
        subs = s.subscores or {}
        if col in ("value", "quality", "growth", "health", "income", "momentum"):
            return subs.get(col)
        val = getattr(s, col, None)
        if kind == "str":
            return (val or "").lower()
        return val

    def _on_select(self, _event=None) -> None:
        sel = self.tree.selection()
        if not sel:
            return
        idx = int(sel[0])
        if idx >= len(self.display):
            return
        self._show_detail(self.display[idx])

    def _show_detail(self, s: StockData) -> None:
        subs = s.subscores or {}
        lines = [
            f"{s.name}  ({s.ticker})    Rank #{s.rank}    Composite score: {num(s.score, '.2f')}",
            f"Sector: {s.sector or '-'}   Industry: {s.industry or '-'}   Source: {s.source or '-'}",
            "",
            f"Price: {num(s.price)} {s.currency}    Market cap: {human_money(s.market_cap, s.currency)}    "
            f"Beta: {num(s.beta, '.2f')}    52w: {num(s.week52_low)} - {num(s.week52_high)}",
            f"P/E: {num(s.pe_ratio, '.2f')}   P/B: {num(s.pb_ratio, '.2f')}   P/S: {num(s.ps_ratio, '.2f')}   "
            f"Div yield: {num(s.dividend_yield, '.2f')}%   Payout: {num(s.payout_ratio, '.1f')}%",
            f"ROE: {num(s.roe, '.2f')}%   ROA: {num(s.roa, '.2f')}%   Margin: {num(s.profit_margin, '.2f')}%   "
            f"D/E: {num(s.debt_to_equity, '.2f')}   Current: {num(s.current_ratio, '.2f')}",
            f"Rev growth: {num(s.revenue_growth, '.2f')}%   EPS growth: {num(s.earnings_growth, '.2f')}%",
            "",
            "Sub-scores:  " + "   ".join(
                f"{k.title()}={num(subs.get(k), '.0f')}"
                for k in ("value", "quality", "growth", "health", "income", "momentum")
            ),
        ]
        if s.errors:
            lines.append("Notes: " + "; ".join(s.errors[:3]))
        text = "\n".join(lines)
        self.detail.configure(state="normal")
        self.detail.delete("1.0", "end")
        self.detail.insert("1.0", text)
        self.detail.configure(state="disabled")

    # --------------------------------------------------------------- misc
    def _set_status(self, msg: str) -> None:
        self.status_var.set(msg)

    def _on_close(self) -> None:
        self._stop_flag.set()
        self.destroy()


def launch() -> None:
    app = ScannerApp()
    app.mainloop()


if __name__ == "__main__":
    launch()
