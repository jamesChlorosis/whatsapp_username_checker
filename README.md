# OG Finder

Android-first helper app for generating, scoring, copying, and manually trying WhatsApp usernames.

It does not call WhatsApp or Meta APIs, automate WhatsApp input, read WhatsApp UI state, or claim usernames. It copies a candidate, opens WhatsApp, and lets you mark what WhatsApp shows.

## Stack

- React + TypeScript + Tailwind
- Capacitor Android
- Local browser storage for queue/status persistence
- Virtualized queue rendering via `@tanstack/react-virtual`

## Development

```bash
npm install
npm run dev
```

## Android

Installable debug APK:

```text
artifacts/whatsapp-username-checker-debug.apk
```

Generate the Android project:

```bash
npm run android:add
```

Sync web assets into Android:

```bash
npm run android:sync
```

Open in Android Studio:

```bash
npm run android:open
```

From Android Studio, run it on an emulator or a connected Android phone.

This repo was built with repo-local JDK/Android SDK tools under `.tools/`; that folder is ignored and is not required if your machine already has Android Studio or Android SDK installed.

## Current Slice

- WhatsApp-format validator
- OG desirability scoring breakdown
- Smart seed-based generator
- Android-native clipboard support through Capacitor
- Android app launcher support for opening WhatsApp
- Manual shadow overlay panel over other apps
- Phone-first queue, current-candidate, and result-marking flow
- Local persistence of generated names, statuses, favorites, and selected item

## Shadow Mode

Shadow Mode starts a floating Android panel that can sit above WhatsApp. It can copy the current candidate, open WhatsApp, and let you manually mark Available, Taken, or Invalid. The panel stores those manual results locally, and the main app can sync them back into the queue.

Shadow Mode does not read WhatsApp's screen, inject input, scrape UI state, or automatically decide availability.
