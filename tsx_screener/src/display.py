"""Rich terminal UI for the TSX Screener.

Provides:
  - Ranked results table with colour coding
  - Detail panel for a single stock
  - Interactive pager (next/prev page, sort, filter by sector)
"""

from __future__ import annotations

import math
from typing import List, Optional

from rich import box
from rich.columns import Columns
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
)
from rich.prompt import Prompt
from rich.rule import Rule
from rich.table import Table
from rich.text import Text
from rich import print as rprint

from .scorer import ScoredStock

console = Console()

# ─── Colour helpers ───────────────────────────────────────────────────────────

def _score_color(score: float) -> str:
    if score >= 75:
        return "bold green"
    if score >= 55:
        return "green"
    if score >= 40:
        return "yellow"
    if score >= 25:
        return "red"
    return "bold red"


def _return_color(pct: Optional[float]) -> str:
    if pct is None:
        return "dim"
    return "green" if pct >= 0 else "red"


def _fmt_pct(val: Optional[float], decimals: int = 1) -> str:
    if val is None:
        return "[dim]—[/dim]"
    color = _return_color(val)
    sign = "+" if val > 0 else ""
    return f"[{color}]{sign}{val:.{decimals}f}%[/{color}]"


def _fmt_price(val: Optional[float]) -> str:
    if val is None:
        return "[dim]—[/dim]"
    return f"${val:,.2f}"


def _fmt_mcap(val: Optional[float]) -> str:
    if val is None:
        return "[dim]—[/dim]"
    if val >= 1e12:
        return f"${val/1e12:.2f}T"
    if val >= 1e9:
        return f"${val/1e9:.2f}B"
    if val >= 1e6:
        return f"${val/1e6:.1f}M"
    return f"${val:,.0f}"


def _fmt_ratio(val: Optional[float], decimals: int = 1) -> str:
    if val is None:
        return "[dim]—[/dim]"
    return f"{val:.{decimals}f}x"


def _fmt_num(val: Optional[float], decimals: int = 1) -> str:
    if val is None:
        return "[dim]—[/dim]"
    return f"{val:.{decimals}f}"


def _score_bar(score: float, width: int = 10) -> Text:
    """Return a Rich Text bar for the score (0–100)."""
    filled = int(round(score / 100 * width))
    color = _score_color(score)
    t = Text()
    t.append("█" * filled, style=color)
    t.append("░" * (width - filled), style="dim")
    return t


def _score_bar_markup(score: float, width: int = 10) -> str:
    """Return a Rich markup string bar for use inside f-strings."""
    filled = int(round(score / 100 * width))
    color = _score_color(score)
    return f"[{color}]{'█' * filled}[/{color}][dim]{'░' * (width - filled)}[/dim]"


# ─── Progress bar ─────────────────────────────────────────────────────────────

def make_progress() -> Progress:
    return Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]{task.description}"),
        BarColumn(bar_width=40),
        TaskProgressColumn(),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=True,
    )


# ─── Results table ────────────────────────────────────────────────────────────

_SORT_KEYS = {
    "rank": lambda s: s.rank,
    "score": lambda s: -s.score_total,
    "price": lambda s: -(s.data.price or 0),
    "mcap": lambda s: -(s.data.market_cap or 0),
    "pe": lambda s: (s.data.pe_ratio or 9999),
    "roe": lambda s: -(s.data.roe or -9999),
    "rev_growth": lambda s: -(s.data.revenue_growth or -9999),
    "3m": lambda s: -(s.data.return_3m or -9999),
    "div": lambda s: -(s.data.dividend_yield or 0),
}


def build_results_table(
    stocks: List[ScoredStock],
    page: int = 1,
    per_page: int = 50,
    sort_key: str = "rank",
    sector_filter: Optional[str] = None,
    show_scores: bool = True,
) -> Table:
    """Build a Rich Table for the given page of results."""
    filtered = stocks
    if sector_filter:
        filtered = [s for s in stocks if sector_filter.lower() in (s.data.sector or "").lower()]

    sorter = _SORT_KEYS.get(sort_key, _SORT_KEYS["rank"])
    filtered.sort(key=sorter)

    total = len(filtered)
    total_pages = max(1, math.ceil(total / per_page))
    page = max(1, min(page, total_pages))
    start = (page - 1) * per_page
    end = start + per_page
    page_data = filtered[start:end]

    title = f"[bold cyan]TSX Screener[/bold cyan]  —  Page {page}/{total_pages}  ({total} stocks)"
    if sector_filter:
        title += f"  |  Sector: [yellow]{sector_filter}[/yellow]"

    table = Table(
        title=title,
        box=box.ROUNDED,
        show_header=True,
        header_style="bold white on dark_blue",
        row_styles=["", "on grey7"],
        expand=True,
    )

    # Columns
    table.add_column("#", justify="right", style="dim", width=4)
    table.add_column("Ticker", style="bold cyan", width=8)
    table.add_column("Company", min_width=18, max_width=32)
    table.add_column("Sector", min_width=12, max_width=18)
    table.add_column("Price\n(CAD)", justify="right", width=10)
    table.add_column("Mkt Cap", justify="right", width=10)
    table.add_column("P/E", justify="right", width=7)
    table.add_column("ROE", justify="right", width=7)
    table.add_column("Rev\nGrowth", justify="right", width=9)
    table.add_column("3M\nReturn", justify="right", width=9)
    table.add_column("Div\nYield", justify="right", width=8)

    if show_scores:
        table.add_column("Score", justify="center", width=14)
        table.add_column("V  Q  G  M  D", justify="center", width=20)

    for sc in page_data:
        d = sc.data
        sector_short = (d.sector or "—")[:16]

        row = [
            str(sc.rank),
            d.ticker,
            (d.name or d.ticker)[:32],
            sector_short,
            _fmt_price(d.price),
            _fmt_mcap(d.market_cap),
            _fmt_ratio(d.pe_ratio),
            _fmt_pct(d.roe),
            _fmt_pct(d.revenue_growth),
            _fmt_pct(d.return_3m),
            _fmt_pct(d.dividend_yield),
        ]

        if show_scores:
            score_text = Text()
            color = _score_color(sc.score_total)
            score_text.append(f"{sc.score_total:4.1f} ", style=color)
            bar = _score_bar(sc.score_total, width=8)
            score_text.append_text(bar)
            sub_scores = (
                f"[dim]{sc.score_value:.0f}[/dim] "
                f"[dim]{sc.score_quality:.0f}[/dim] "
                f"[dim]{sc.score_growth:.0f}[/dim] "
                f"[dim]{sc.score_momentum:.0f}[/dim] "
                f"[dim]{sc.score_dividend:.0f}[/dim]"
            )
            row += [score_text, sub_scores]

        table.add_row(*row)

    return table


# ─── Detail panel ─────────────────────────────────────────────────────────────

def build_detail_panel(sc: ScoredStock) -> Panel:
    """Build a rich detail panel for a single stock."""
    d = sc.data

    def _row(label: str, value: str) -> str:
        return f"  [bold]{label:<22}[/bold] {value}"

    lines = [
        f"\n[bold cyan]{d.ticker}[/bold cyan]  [white]{d.name}[/white]",
        f"  [dim]{d.sector}  •  {d.industry}[/dim]\n",
        _row("Exchange:", d.exchange),
        _row("Price (CAD):", _fmt_price(d.price)),
        _row("Market Cap:", _fmt_mcap(d.market_cap)),
        _row("52W High / Low:", f"{_fmt_price(d.week_52_high)} / {_fmt_price(d.week_52_low)}"),
        _row("Avg Volume (30d):", _fmt_num(d.avg_volume_30d, 0) if d.avg_volume_30d else "—"),
        _row("Beta:", _fmt_num(d.beta, 2)),
        "",
        "  [bold underline]Valuation[/bold underline]",
        _row("P/E (TTM):", _fmt_ratio(d.pe_ratio)),
        _row("Forward P/E:", _fmt_ratio(d.forward_pe)),
        _row("P/B:", _fmt_ratio(d.pb_ratio)),
        _row("P/S:", _fmt_ratio(d.ps_ratio)),
        _row("EV/EBITDA:", _fmt_ratio(d.ev_ebitda)),
        "",
        "  [bold underline]Profitability[/bold underline]",
        _row("ROE:", _fmt_pct(d.roe)),
        _row("ROA:", _fmt_pct(d.roa)),
        _row("Gross Margin:", _fmt_pct(d.gross_margin)),
        _row("Operating Margin:", _fmt_pct(d.operating_margin)),
        _row("Net Margin:", _fmt_pct(d.net_margin)),
        "",
        "  [bold underline]Growth (YoY)[/bold underline]",
        _row("Revenue Growth:", _fmt_pct(d.revenue_growth)),
        _row("Earnings Growth:", _fmt_pct(d.earnings_growth)),
        _row("EPS (TTM):", _fmt_num(d.eps_ttm, 2)),
        _row("EPS (Forward):", _fmt_num(d.eps_forward, 2)),
        "",
        "  [bold underline]Balance Sheet[/bold underline]",
        _row("Debt / Equity:", _fmt_num(d.debt_to_equity, 2)),
        _row("Current Ratio:", _fmt_num(d.current_ratio, 2)),
        "",
        "  [bold underline]Dividend[/bold underline]",
        _row("Yield:", _fmt_pct(d.dividend_yield)),
        _row("Annual Rate (CAD):", _fmt_price(d.dividend_rate)),
        _row("Payout Ratio:", _fmt_pct(d.payout_ratio)),
        "",
        "  [bold underline]Price Returns[/bold underline]",
        _row("1 Month:", _fmt_pct(d.return_1m)),
        _row("3 Month:", _fmt_pct(d.return_3m)),
        _row("6 Month:", _fmt_pct(d.return_6m)),
        _row("1 Year:", _fmt_pct(d.return_1y)),
        "",
        "  [bold underline]Composite Score[/bold underline]",
        _row("Overall:", f"[{_score_color(sc.score_total)}]{sc.score_total:.1f}[/{_score_color(sc.score_total)}]  {_score_bar_markup(sc.score_total, 16)}"),
        _row("Rank:", f"#{sc.rank}"),
        _row("Value:", _fmt_num(sc.score_value, 1)),
        _row("Quality:", _fmt_num(sc.score_quality, 1)),
        _row("Growth:", _fmt_num(sc.score_growth, 1)),
        _row("Momentum:", _fmt_num(sc.score_momentum, 1)),
        _row("Dividend:", _fmt_num(sc.score_dividend, 1)),
        _row("Data Quality:", f"{sc.data_quality}%"),
        "",
        f"  [dim]Source: {d.data_source}  |  Fetched: {d.fetch_timestamp[:19]}[/dim]",
    ]

    content = "\n".join(lines)
    return Panel(
        content,
        title=f"[bold cyan]Stock Detail — {d.ticker}[/bold cyan]",
        border_style="cyan",
        padding=(0, 2),
    )


# ─── Sector summary ───────────────────────────────────────────────────────────

def build_sector_summary(stocks: List[ScoredStock]) -> Table:
    """Build a summary table by sector."""
    import statistics
    from collections import defaultdict

    sectors: dict = defaultdict(list)
    for sc in stocks:
        key = sc.data.sector or "Unknown"
        sectors[key].append(sc)

    table = Table(
        title="[bold cyan]Sector Summary[/bold cyan]",
        box=box.SIMPLE_HEAD,
        show_header=True,
        header_style="bold white",
    )
    table.add_column("Sector", min_width=20)
    table.add_column("Count", justify="right")
    table.add_column("Avg Score", justify="right")
    table.add_column("Avg P/E", justify="right")
    table.add_column("Avg ROE", justify="right")
    table.add_column("Avg Rev Growth", justify="right")
    table.add_column("Avg Div Yield", justify="right")

    rows = []
    for sector, scs in sectors.items():
        scored = [s for s in scs if s.score_total > 0]
        avg_score = statistics.mean(s.score_total for s in scored) if scored else 0
        pes = [s.data.pe_ratio for s in scs if s.data.pe_ratio]
        roes = [s.data.roe for s in scs if s.data.roe]
        revgs = [s.data.revenue_growth for s in scs if s.data.revenue_growth]
        divs = [s.data.dividend_yield for s in scs if s.data.dividend_yield]

        rows.append((
            sector,
            len(scs),
            avg_score,
            statistics.mean(pes) if pes else None,
            statistics.mean(roes) if roes else None,
            statistics.mean(revgs) if revgs else None,
            statistics.mean(divs) if divs else None,
        ))

    rows.sort(key=lambda r: r[2], reverse=True)
    for sector, count, avg_score, avg_pe, avg_roe, avg_revg, avg_div in rows:
        color = _score_color(avg_score)
        table.add_row(
            sector,
            str(count),
            f"[{color}]{avg_score:.1f}[/{color}]",
            _fmt_ratio(avg_pe),
            _fmt_pct(avg_roe),
            _fmt_pct(avg_revg),
            _fmt_pct(avg_div),
        )
    return table


# ─── Interactive session ──────────────────────────────────────────────────────

def interactive_session(stocks: List[ScoredStock], per_page: int = 50) -> None:
    """Run an interactive terminal session for browsing results."""
    page = 1
    sort_key = "rank"
    sector_filter: Optional[str] = None

    sectors = sorted({s.data.sector for s in stocks if s.data.sector})

    HELP = """
[bold]Commands[/bold]
  [cyan]n[/cyan]       Next page
  [cyan]p[/cyan]       Previous page
  [cyan]g <N>[/cyan]   Go to page N
  [cyan]s <key>[/cyan] Sort by: rank score price mcap pe roe rev_growth 3m div
  [cyan]f <sec>[/cyan] Filter by sector (partial match)  |  [cyan]fc[/cyan] Clear filter
  [cyan]d <ticker>[/cyan]  Show detail for a stock
  [cyan]sec[/cyan]     Show sector summary
  [cyan]top <N>[/cyan] Show top N stocks
  [cyan]r[/cyan]       Refresh / re-sort
  [cyan]q[/cyan]       Quit
"""

    console.print(
        Panel.fit(
            "[bold cyan]TSX Screener[/bold cyan]  —  Interactive Mode\n"
            "[dim]Type [bold]h[/bold] for help, [bold]q[/bold] to quit[/dim]",
            border_style="cyan",
        )
    )

    total_pages = lambda: max(1, math.ceil(
        len([s for s in stocks if not sector_filter or sector_filter.lower() in (s.data.sector or "").lower()])
        / per_page
    ))

    while True:
        try:
            table = build_results_table(
                stocks,
                page=page,
                per_page=per_page,
                sort_key=sort_key,
                sector_filter=sector_filter,
            )
            console.print(table)
            console.print(
                f"[dim]  Sort:[/dim] [cyan]{sort_key}[/cyan]  "
                f"[dim]Page:[/dim] [cyan]{page}/{total_pages()}[/cyan]  "
                f"[dim]Stocks:[/dim] [cyan]{len(stocks)}[/cyan]  "
                "[dim]→ Type a command or [bold]h[/bold] for help:[/dim]",
                end="  ",
            )

            cmd = input().strip().lower()
        except (KeyboardInterrupt, EOFError):
            break

        if not cmd:
            continue
        elif cmd == "q":
            break
        elif cmd == "h":
            console.print(HELP)
        elif cmd == "n":
            page = min(page + 1, total_pages())
        elif cmd == "p":
            page = max(1, page - 1)
        elif cmd.startswith("g "):
            try:
                page = max(1, min(int(cmd.split()[1]), total_pages()))
            except (ValueError, IndexError):
                console.print("[red]Usage: g <page_number>[/red]")
        elif cmd.startswith("s "):
            key = cmd.split(None, 1)[1].strip()
            if key in _SORT_KEYS:
                sort_key = key
                page = 1
            else:
                console.print(f"[red]Unknown sort key. Choose: {', '.join(_SORT_KEYS)}[/red]")
        elif cmd.startswith("f "):
            sector_filter = cmd.split(None, 1)[1].strip()
            page = 1
        elif cmd == "fc":
            sector_filter = None
            page = 1
        elif cmd.startswith("d "):
            ticker = cmd.split(None, 1)[1].strip().upper()
            match = next((s for s in stocks if s.data.ticker == ticker), None)
            if match:
                console.print(build_detail_panel(match))
            else:
                console.print(f"[red]Ticker '{ticker}' not found.[/red]")
        elif cmd == "sec":
            console.print(build_sector_summary(stocks))
        elif cmd.startswith("top "):
            try:
                n = int(cmd.split()[1])
                top = sorted(stocks, key=lambda s: s.rank)[:n]
                console.print(
                    build_results_table(top, page=1, per_page=n, sort_key="rank")
                )
            except (ValueError, IndexError):
                console.print("[red]Usage: top <N>[/red]")
        elif cmd == "r":
            pass  # just re-render
        else:
            console.print(f"[dim]Unknown command '{cmd}'. Type h for help.[/dim]")

    console.print("[dim]Exiting TSX Screener. Goodbye![/dim]")
