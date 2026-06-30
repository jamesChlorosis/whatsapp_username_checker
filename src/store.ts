import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UsernameRow, UsernameStatus } from "./types";
import { generateLocalCandidates, seedRows } from "./utils/localData";

interface FinderState {
  rows: UsernameRow[];
  selectedId: number | null;
  search: string;
  statusFilter: UsernameStatus | "all";
  favoritesOnly: boolean;
  commandOpen: boolean;
  lightMode: boolean;
  setSearch: (value: string) => void;
  setStatusFilter: (value: UsernameStatus | "all") => void;
  setFavoritesOnly: (value: boolean) => void;
  setCommandOpen: (value: boolean) => void;
  toggleTheme: () => void;
  select: (id: number) => void;
  next: () => void;
  previous: () => void;
  mark: (status: UsernameStatus) => void;
  toggleFavorite: () => void;
  appendGenerated: (seeds: string[], limit: number) => void;
}

const findVisibleIndex = (rows: UsernameRow[], selectedId: number | null) =>
  Math.max(0, rows.findIndex((row) => row.id === selectedId));

export const useFinderStore = create<FinderState>()(
  persist(
    (set, get) => ({
      rows: seedRows,
      selectedId: seedRows[0]?.id ?? null,
      search: "",
      statusFilter: "all",
      favoritesOnly: false,
      commandOpen: false,
      lightMode: false,
      setSearch: (search) => set({ search }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleTheme: () => set((state) => ({ lightMode: !state.lightMode })),
      select: (selectedId) => set({ selectedId }),
      next: () => {
        const { rows, selectedId } = get();
        const index = findVisibleIndex(rows, selectedId);
        set({ selectedId: rows[Math.min(rows.length - 1, index + 1)]?.id ?? null });
      },
      previous: () => {
        const { rows, selectedId } = get();
        const index = findVisibleIndex(rows, selectedId);
        set({ selectedId: rows[Math.max(0, index - 1)]?.id ?? null });
      },
      mark: (status) =>
        set((state) => ({
          rows: state.rows.map((row) =>
            row.id === state.selectedId
              ? { ...row, status, lastCheckedAt: new Date().toISOString() }
              : row,
          ),
        })),
      toggleFavorite: () =>
        set((state) => ({
          rows: state.rows.map((row) =>
            row.id === state.selectedId ? { ...row, favorite: !row.favorite } : row,
          ),
        })),
      appendGenerated: (seeds, limit) =>
        set((state) => {
          const next = generateLocalCandidates(seeds, limit, state.rows.length + 1);
          const known = new Set(state.rows.map((row) => row.text));
          return {
            rows: [...state.rows, ...next.filter((row) => !known.has(row.text))],
          };
        }),
    }),
    {
      name: "og-finder-mobile-state",
      partialize: (state) => ({
        rows: state.rows,
        selectedId: state.selectedId,
        lightMode: state.lightMode,
      }),
    },
  ),
);
