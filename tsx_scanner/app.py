from __future__ import annotations

import argparse
import queue
import subprocess
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from .config import DEFAULT_CONFIG_PATH, ensure_config, load_settings
from .scanner import CSV_FIELDS, Scanner, read_results_csv, write_results_csv
from .universe import load_universe, update_universe


DISPLAY_COLUMNS = [
    "rank",
    "score",
    "symbol",
    "name",
    "price",
    "market_cap",
    "volume",
    "pe_ratio",
    "forward_pe",
    "revenue_growth",
    "profit_margin",
    "return_on_equity",
    "debt_to_equity",
    "dividend_yield",
    "beta",
    "sector",
    "industry",
    "provider",
    "error",
]


class TSXScannerApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("TSX Stock Scanner")
        self.geometry("1450x800")
        self.minsize(1100, 650)
        self.settings = load_settings()
        self.scanner = Scanner(self.settings)
        self.events: queue.Queue[tuple[str, object]] = queue.Queue()
        self.rows: list[dict[str, object]] = []
        self.sort_state: tuple[str, bool] = ("rank", False)
        self.worker: threading.Thread | None = None

        self._build_widgets()
        self._load_cached_results()
        self.after(150, self._drain_events)

    def _build_widgets(self) -> None:
        top = ttk.Frame(self, padding=10)
        top.pack(fill=tk.X)

        self.scan_button = ttk.Button(top, text="Scan TSX", command=lambda: self._start_scan(False))
        self.scan_button.pack(side=tk.LEFT, padx=(0, 6))
        ttk.Button(top, text="Update Universe + Scan", command=lambda: self._start_scan(True)).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="Update Ticker List Only", command=self._start_universe_update).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="Stop", command=self._stop_scan).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="Export CSV", command=self._export_csv).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="Open Config", command=self._open_config).pack(side=tk.LEFT, padx=6)

        ttk.Label(top, text="Filter:").pack(side=tk.LEFT, padx=(18, 4))
        self.filter_var = tk.StringVar()
        self.filter_var.trace_add("write", lambda *_: self._render_rows())
        ttk.Entry(top, textvariable=self.filter_var, width=28).pack(side=tk.LEFT)

        ttk.Label(top, text="Limit:").pack(side=tk.LEFT, padx=(18, 4))
        self.limit_var = tk.StringVar()
        ttk.Entry(top, textvariable=self.limit_var, width=8).pack(side=tk.LEFT)

        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(self, textvariable=self.status_var, anchor=tk.W, padding=(10, 4)).pack(fill=tk.X)

        progress_frame = ttk.Frame(self, padding=(10, 0, 10, 8))
        progress_frame.pack(fill=tk.X)
        self.progress = ttk.Progressbar(progress_frame, mode="determinate")
        self.progress.pack(fill=tk.X)

        table_frame = ttk.Frame(self, padding=(10, 0, 10, 10))
        table_frame.pack(fill=tk.BOTH, expand=True)
        self.tree = ttk.Treeview(table_frame, columns=DISPLAY_COLUMNS, show="headings")
        y_scroll = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        x_scroll = ttk.Scrollbar(table_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=y_scroll.set, xscrollcommand=x_scroll.set)
        self.tree.grid(row=0, column=0, sticky="nsew")
        y_scroll.grid(row=0, column=1, sticky="ns")
        x_scroll.grid(row=1, column=0, sticky="ew")
        table_frame.columnconfigure(0, weight=1)
        table_frame.rowconfigure(0, weight=1)

        widths = {"rank": 55, "score": 70, "symbol": 85, "name": 250, "error": 320}
        for column in DISPLAY_COLUMNS:
            self.tree.heading(column, text=column.replace("_", " ").title(), command=lambda c=column: self._sort_by(c))
            self.tree.column(column, width=widths.get(column, 120), minwidth=55, stretch=column in {"name", "error"})

    def _load_cached_results(self) -> None:
        cached = read_results_csv(self.settings.results_cache)
        if cached:
            self.rows = cached
            self.status_var.set(f"Loaded {len(cached)} cached results from {self.settings.results_cache}")
            self._render_rows()
        else:
            cached_universe = load_universe(self.settings.universe_cache)
            self.status_var.set(f"Ready. Cached TSX universe contains {len(cached_universe)} symbols.")

    def _set_busy(self, busy: bool) -> None:
        self.scan_button.configure(state=tk.DISABLED if busy else tk.NORMAL)

    def _start_scan(self, refresh_universe: bool) -> None:
        if self.worker and self.worker.is_alive():
            messagebox.showinfo("Scan already running", "A scan is already in progress.")
            return
        try:
            limit = int(self.limit_var.get()) if self.limit_var.get().strip() else None
        except ValueError:
            messagebox.showerror("Invalid limit", "Limit must be a whole number.")
            return
        self.settings = load_settings()
        self.scanner = Scanner(self.settings)
        self.rows = []
        self._render_rows()
        self.progress.configure(value=0, maximum=100)
        self._set_busy(True)
        self.worker = threading.Thread(target=self._scan_worker, args=(refresh_universe, limit), daemon=True)
        self.worker.start()

    def _scan_worker(self, refresh_universe: bool, limit: int | None) -> None:
        def progress(index: int, total: int, stock, metrics) -> None:
            self.events.put(("progress", (index, total, stock.symbol, metrics.provider or "", metrics.error or "")))

        try:
            results = self.scanner.scan(refresh_universe=refresh_universe, limit=limit, progress=progress)
            self.events.put(("scan_done", results))
        except Exception as exc:
            self.events.put(("error", exc))

    def _start_universe_update(self) -> None:
        if self.worker and self.worker.is_alive():
            messagebox.showinfo("Busy", "Wait for the current operation to finish.")
            return
        self.settings = load_settings()
        self._set_busy(True)
        self.worker = threading.Thread(target=self._universe_worker, daemon=True)
        self.worker.start()

    def _universe_worker(self) -> None:
        try:
            stocks = update_universe(self.settings.universe_cache, self.settings.request_timeout_seconds)
            self.events.put(("universe_done", len(stocks)))
        except Exception as exc:
            self.events.put(("error", exc))

    def _stop_scan(self) -> None:
        self.scanner.cancel()
        self.status_var.set("Stopping after current symbol...")

    def _drain_events(self) -> None:
        try:
            while True:
                event, payload = self.events.get_nowait()
                if event == "progress":
                    index, total, symbol, provider, error = payload
                    self.progress.configure(maximum=total, value=index)
                    suffix = f" via {provider}" if provider else ""
                    if error:
                        suffix += " (fallbacks exhausted)"
                    self.status_var.set(f"Scanned {index}/{total}: {symbol}{suffix}")
                elif event == "scan_done":
                    self.rows = [item.to_row() for item in payload]
                    self._render_rows()
                    self.progress.configure(value=self.progress["maximum"])
                    self.status_var.set(f"Scan complete: {len(self.rows)} ranked stocks. Results saved to {self.settings.results_cache}")
                    self._set_busy(False)
                elif event == "universe_done":
                    self.status_var.set(f"Updated TSX ticker list: {payload} common-share symbols cached.")
                    self._set_busy(False)
                elif event == "error":
                    self._set_busy(False)
                    self.status_var.set(f"Error: {payload}")
                    messagebox.showerror("TSX Scanner Error", str(payload))
        except queue.Empty:
            pass
        self.after(150, self._drain_events)

    def _sort_by(self, column: str) -> None:
        current_column, descending = self.sort_state
        descending = not descending if current_column == column else False
        self.sort_state = (column, descending)
        self._render_rows()

    def _render_rows(self) -> None:
        for item in self.tree.get_children():
            self.tree.delete(item)
        filter_text = self.filter_var.get().lower().strip()
        rows = [
            row
            for row in self.rows
            if not filter_text or filter_text in " ".join(str(row.get(column, "")).lower() for column in DISPLAY_COLUMNS)
        ]
        column, descending = self.sort_state
        rows.sort(key=lambda row: self._sort_key(row.get(column)), reverse=descending)
        for row in rows:
            values = [self._format_value(row.get(column)) for column in DISPLAY_COLUMNS]
            self.tree.insert("", tk.END, values=values)

    @staticmethod
    def _sort_key(value: object) -> tuple[int, float | str]:
        try:
            return (0, float(value))
        except (TypeError, ValueError):
            return (1, str(value or "").lower())

    @staticmethod
    def _format_value(value: object) -> str:
        if value is None:
            return ""
        if isinstance(value, float):
            return f"{value:,.4g}"
        text = str(value)
        try:
            number = float(text)
        except ValueError:
            return text
        if abs(number) >= 1_000_000:
            return f"{number:,.0f}"
        if abs(number) >= 10:
            return f"{number:,.2f}"
        return f"{number:,.4f}"

    def _export_csv(self) -> None:
        if not self.rows:
            messagebox.showinfo("No results", "Run a scan before exporting.")
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
            initialfile="tsx_ranked_stocks.csv",
        )
        if not path:
            return
        ranked_like = []
        for row in self.rows:
            ranked_like.append(type("CsvRow", (), {"to_row": lambda self, row=row: row})())
        write_results_csv(ranked_like, Path(path))
        self.status_var.set(f"Exported {len(self.rows)} rows to {path}")

    def _open_config(self) -> None:
        config_path = ensure_config(DEFAULT_CONFIG_PATH)
        try:
            if sys.platform.startswith("win"):
                subprocess.Popen(["notepad", str(config_path)])
            elif sys.platform == "darwin":
                subprocess.Popen(["open", str(config_path)])
            else:
                subprocess.Popen(["xdg-open", str(config_path)])
        except Exception:
            messagebox.showinfo("Config file", f"Edit API keys in:\n{config_path}")


def run_cli(args: argparse.Namespace) -> int:
    settings = load_settings()
    scanner = Scanner(settings)
    results = scanner.scan(refresh_universe=args.update_universe, limit=args.limit)
    if args.export:
        write_results_csv(results, Path(args.export))
    print(f"Ranked {len(results)} TSX stocks.")
    for item in results[: args.top]:
        row = item.to_row()
        print(f"{row['rank']:>4} {row['symbol']:<10} {row['score']:>6} {row['name']}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Scan and rank TSX-listed common shares.")
    parser.add_argument("--no-gui", action="store_true", help="Run from CMD/terminal without opening the desktop UI.")
    parser.add_argument("--update-universe", action="store_true", help="Refresh the locally cached TSX ticker list.")
    parser.add_argument("--limit", type=int, help="Scan only the first N symbols; useful for smoke tests.")
    parser.add_argument("--top", type=int, default=25, help="Number of ranked rows to print in --no-gui mode.")
    parser.add_argument("--export", help="CSV file to write in --no-gui mode.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    ensure_config()
    if args.no_gui:
        return run_cli(args)
    app = TSXScannerApp()
    app.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
