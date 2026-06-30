# Architecture

OG Finder is an Android-first Capacitor app. The React frontend owns generation, validation, scoring, queue state, and the manual WhatsApp checking flow.

## Mobile Shell

- Capacitor wraps the built Vite app into an Android project.
- `@capacitor/clipboard` writes the current username to the Android clipboard.
- `@capacitor/app-launcher` opens WhatsApp through `whatsapp://`.

## Frontend

- React + TypeScript for UI and state.
- Tailwind for styling.
- Zustand with local persistence for queue data.
- `@tanstack/react-virtual` keeps the queue responsive as it grows.

## Safety Boundary

The app does not know live availability. The user manually pastes the copied username inside WhatsApp and marks Available, Taken, Invalid, or Unsure after reading WhatsApp's own indicator.

## Next Engineering Steps

- Add IndexedDB or SQLite-backed persistence for very large queues.
- Add CSV/TXT import and export.
- Add Android notification/reminder support for saved favorites.
- Add a real versioned source bundle for dictionaries and categories.
