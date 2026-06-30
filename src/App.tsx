import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Moon,
  Search,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  copyUsername,
  ensureShadowOverlayPermission,
  getShadowResults,
  openWhatsApp,
  startShadowOverlay,
  stopShadowOverlay,
} from "./platform";
import { useFinderStore } from "./store";
import { UsernameStatus } from "./types";

const statusStyles: Record<UsernameStatus, string> = {
  unknown: "border-line bg-zinc-900/60 text-zinc-300",
  available: "border-mint/40 bg-mint/10 text-mint",
  taken: "border-coral/40 bg-coral/10 text-coral",
  invalid: "border-zinc-500/40 bg-zinc-700/30 text-zinc-300",
  reserved: "border-citron/40 bg-citron/10 text-citron",
};

export function App() {
  const rows = useFinderStore((state) => state.rows);
  const selectedId = useFinderStore((state) => state.selectedId);
  const search = useFinderStore((state) => state.search);
  const statusFilter = useFinderStore((state) => state.statusFilter);
  const favoritesOnly = useFinderStore((state) => state.favoritesOnly);
  const lightMode = useFinderStore((state) => state.lightMode);
  const setSearch = useFinderStore((state) => state.setSearch);
  const setStatusFilter = useFinderStore((state) => state.setStatusFilter);
  const setFavoritesOnly = useFinderStore((state) => state.setFavoritesOnly);
  const toggleTheme = useFinderStore((state) => state.toggleTheme);
  const mark = useFinderStore((state) => state.mark);
  const applyShadowResults = useFinderStore((state) => state.applyShadowResults);
  const next = useFinderStore((state) => state.next);
  const previous = useFinderStore((state) => state.previous);
  const toggleFavorite = useFinderStore((state) => state.toggleFavorite);

  const visibleRows = useMemo(() => {
    const query = search.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = row.text.includes(query) || row.notes.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesFavorite = !favoritesOnly || row.favorite;
      return matchesSearch && matchesStatus && matchesFavorite;
    });
  }, [favoritesOnly, rows, search, statusFilter]);

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const selectedIndex = Math.max(0, rows.findIndex((row) => row.id === selected?.id));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", !lightMode);
  }, [lightMode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key === "ArrowRight") next();
      if (mod && event.key === "ArrowLeft") previous();
      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFavorite();
      }
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        document.getElementById("finder-search")?.focus();
      }
      if (!mod && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        if (event.key.toLowerCase() === "a") mark("available");
        if (event.key.toLowerCase() === "t") mark("taken");
        if (event.key.toLowerCase() === "i") mark("invalid");
        if (event.key.toLowerCase() === "u") mark("unknown");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mark, next, previous, toggleFavorite]);

  return (
    <main className="min-h-screen bg-zinc-100 text-ink dark:bg-ink dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-3 px-3 pb-5 pt-[env(safe-area-inset-top)] sm:px-4">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-300 bg-zinc-100/95 py-3 backdrop-blur dark:border-line dark:bg-ink/95">
          <div>
            <h1 className="text-xl font-semibold tracking-normal">OG Finder</h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Android username checker helper</p>
          </div>
          <button className="icon-button" title="Toggle theme" onClick={toggleTheme}>
            {lightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-3">
            <TryPanel
              selected={selected}
              rows={rows}
              selectedIndex={selectedIndex}
              applyShadowResults={applyShadowResults}
            />
            <FilterBar
              search={search}
              statusFilter={statusFilter}
              favoritesOnly={favoritesOnly}
              setSearch={setSearch}
              setStatusFilter={setStatusFilter}
              setFavoritesOnly={setFavoritesOnly}
            />
            <QueueList rows={visibleRows} selectedId={selectedId} />
          </div>
          <div className="flex flex-col gap-3">
            <GeneratorPanel />
            {selected ? <ScorePanel selected={selected} /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function TryPanel({
  selected,
  rows,
  selectedIndex,
  applyShadowResults,
}: {
  selected?: ReturnType<typeof useFinderStore.getState>["rows"][number];
  rows: ReturnType<typeof useFinderStore.getState>["rows"];
  selectedIndex: number;
  applyShadowResults: ReturnType<typeof useFinderStore.getState>["applyShadowResults"];
}) {
  const mark = useFinderStore((state) => state.mark);
  const next = useFinderStore((state) => state.next);
  const previous = useFinderStore((state) => state.previous);
  const toggleFavorite = useFinderStore((state) => state.toggleFavorite);
  const [feedback, setFeedback] = useState("");

  if (!selected) return null;

  const copy = async () => {
    await copyUsername(selected.text);
    setFeedback("Copied");
    window.setTimeout(() => setFeedback(""), 1300);
  };

  const tryInWhatsApp = async () => {
    await copy();
    await openWhatsApp();
  };

  const startShadow = async () => {
    try {
      const granted = await ensureShadowOverlayPermission();
      if (!granted) {
        setFeedback("Enable overlay permission, then tap Shadow again");
        return;
      }
      await startShadowOverlay(rows.map((row) => row.text), selectedIndex);
      setFeedback("Shadow panel started");
      await openWhatsApp();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Shadow panel could not start");
    }
  };

  const syncShadow = async () => {
    const results = await getShadowResults();
    const changed = applyShadowResults(results);
    setFeedback(`Synced ${changed} result${changed === 1 ? "" : "s"}`);
  };

  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-4 shadow-glow dark:border-line dark:bg-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-4xl font-semibold sm:text-5xl">{selected.text}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>Score {selected.totalScore}</span>
            <span>{selected.length} chars</span>
            <span className={`rounded-full border px-2 py-1 text-xs ${statusStyles[selected.status]}`}>{selected.status}</span>
          </div>
        </div>
        <button className="icon-button shrink-0" title="Favorite" onClick={toggleFavorite}>
          <Star className={selected.favorite ? "fill-citron text-citron" : ""} size={20} />
        </button>
      </div>

      {selected.invalidReason ? <p className="mt-3 text-sm text-coral">{selected.invalidReason}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button className="primary-button col-span-2" onClick={tryInWhatsApp}>
          <ClipboardCheck size={18} /> Try in WhatsApp
        </button>
        <button className="text-button col-span-2" onClick={startShadow}>
          <ExternalLink size={17} /> Start Shadow Panel
        </button>
        <button className="text-button" onClick={copy}>
          <Copy size={17} /> Copy
        </button>
        <button className="text-button" onClick={openWhatsApp}>
          <ExternalLink size={17} /> Open
        </button>
        <button className="text-button" onClick={previous}>
          <ChevronLeft size={17} /> Previous
        </button>
        <button className="text-button" onClick={next}>
          Next <ChevronRight size={17} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="status-button available" onClick={() => mark("available")}>Available</button>
        <button className="status-button taken" onClick={() => mark("taken")}>Taken</button>
        <button className="status-button invalid" onClick={() => mark("invalid")}>Invalid</button>
        <button className="status-button unknown" onClick={() => mark("unknown")}>Unsure</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="text-button" onClick={syncShadow}>Sync shadow results</button>
        <button className="text-button" onClick={stopShadowOverlay}>Stop shadow</button>
      </div>

      <div className="mt-4 min-h-5 text-center text-sm font-medium text-mint">{feedback}</div>
      <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-xs text-coral">
        WhatsApp availability must be read by you inside WhatsApp. This app does not automate or query WhatsApp.
      </p>
    </section>
  );
}

function FilterBar({
  search,
  statusFilter,
  favoritesOnly,
  setSearch,
  setStatusFilter,
  setFavoritesOnly,
}: {
  search: string;
  statusFilter: UsernameStatus | "all";
  favoritesOnly: boolean;
  setSearch: (value: string) => void;
  setStatusFilter: (value: UsernameStatus | "all") => void;
  setFavoritesOnly: (value: boolean) => void;
}) {
  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-3 dark:border-line dark:bg-panel">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <input
          id="finder-search"
          className="field pl-9"
          placeholder="Search usernames"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UsernameStatus | "all")}>
          <option value="all">All status</option>
          <option value="unknown">Unknown</option>
          <option value="available">Available</option>
          <option value="taken">Taken</option>
          <option value="invalid">Invalid</option>
          <option value="reserved">Reserved</option>
        </select>
        <button className={`icon-button ${favoritesOnly ? "border-citron/50 bg-citron/10 text-citron" : ""}`} title="Favorites" onClick={() => setFavoritesOnly(!favoritesOnly)}>
          <Star size={18} />
        </button>
      </div>
    </section>
  );
}

function QueueList({ rows, selectedId }: { rows: ReturnType<typeof useFinderStore.getState>["rows"]; selectedId: number | null }) {
  const select = useFinderStore((state) => state.select);
  const parentRef = useState<HTMLDivElement | null>(null);
  const [scrollParent, setScrollParent] = parentRef;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollParent,
    estimateSize: () => 62,
    overscan: 12,
  });

  return (
    <section className="flex h-[430px] flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white dark:border-line dark:bg-panel sm:h-[520px]">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-xs font-semibold uppercase text-zinc-500 dark:border-line">
        <span>Queue</span>
        <span>{rows.length} names</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto" ref={setScrollParent}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            return (
              <button
                key={row.id}
                className={`absolute left-0 grid w-full grid-cols-[minmax(0,1fr)_72px] items-center border-b border-zinc-200 px-3 py-2 text-left transition dark:border-line ${
                  row.id === selectedId ? "bg-citron/10" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                style={{ height: `${item.size}px`, transform: `translateY(${item.start}px)` }}
                onClick={() => select(row.id)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold">{row.text}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{row.length} chars</span>
                    <span className={`rounded-full border px-2 py-0.5 ${statusStyles[row.status]}`}>{row.status}</span>
                    {row.favorite ? <Star className="fill-citron text-citron" size={13} /> : null}
                  </span>
                </span>
                <span className="text-right text-lg font-semibold tabular-nums">{row.totalScore}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GeneratorPanel() {
  const appendGenerated = useFinderStore((state) => state.appendGenerated);
  const [seedText, setSeedText] = useState("cat, dog, apple, money, raticate, sandshrew");
  const [limit, setLimit] = useState(50);
  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-line dark:bg-panel">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-citron" size={20} />
        <h2 className="text-lg font-semibold">Generator</h2>
      </div>
      <label className="label" htmlFor="seeds">Seed words</label>
      <textarea
        id="seeds"
        className="field min-h-[96px] resize-none"
        value={seedText}
        onChange={(event) => setSeedText(event.target.value)}
      />
      <label className="label mt-4" htmlFor="limit">Candidates</label>
      <input
        id="limit"
        className="field"
        type="number"
        min={1}
        max={5000}
        value={limit}
        onChange={(event) => setLimit(Number(event.target.value))}
      />
      <button className="primary-button mt-4 w-full" onClick={() => appendGenerated(seedText.split(/[\n,]+/), limit)}>
        Generate
      </button>
    </section>
  );
}

function ScorePanel({ selected }: { selected: ReturnType<typeof useFinderStore.getState>["rows"][number] }) {
  return (
    <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-line dark:bg-panel">
      <h2 className="text-lg font-semibold">Score</h2>
      <div className="mt-4 space-y-3">
        {Object.entries(selected.score).map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>{key.replace("Score", "")}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-2 rounded-full bg-citron" style={{ width: `${Math.min(100, value * 5)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
