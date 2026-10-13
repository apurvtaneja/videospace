# VideoSpace

Fullscreen YouTube videos open in their own macOS Space, and the tab slides back into its window when you exit.

Normally, fullscreening a video in Chrome on macOS takes the *whole window* (every tab in it) into a fullscreen Space. VideoSpace moves just the video's tab into its own window first, so:

- the video gets its own Space with a single native macOS zoom,
- your original window stays on the desktop with the rest of its tabs,
- when you exit, the video zooms back out onto your window and the tab returns to its old position, pinned state and tab group.

## Install (development)

```sh
npm install
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked** and select the `dist/` folder.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the minified extension into `dist/` |
| `npm run dev` | Rebuilds on change (with inline source maps) |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run assets` | Re-renders `icons/` and `store/` images from `assets/*.svg` |
| `npm run package` | Typecheck + test + build, then zips `dist/` into `videospace-<version>.zip` for the Chrome Web Store |

The version lives in `package.json` only; the build writes it into the manifest.

## How it works

- `src/content/main-world-hook.ts` runs in the page and holds YouTube's `requestFullscreen()` call.
- `src/content/fullscreen-controller.ts` asks the service worker to detach the tab, then performs the native fullscreen request.
- `src/background/service-worker.ts` moves the tab into a new window placed exactly over the original one (so the macOS zoom starts from where your window already is). When fullscreen ends, it waits for the native zoom-out to land, then moves the tab back.

If the tab is already alone in its window, or the window is already fullscreen, nothing is moved and fullscreen happens normally.

### Resource use

- The service worker has a single event listener (`runtime.onMessage`), so it only starts when a video goes fullscreen. It never wakes for tab, window or navigation events.
- The content scripts total about 1.7 KB and do nothing until a fullscreen request.
- No network requests, no polling, no timers while idle. Session state lives in `chrome.storage.session` (in memory, cleared when the browser quits).

## Limitations

- Built for macOS Spaces. On other platforms it still works, but a separate fullscreen window has less benefit there.
- Runs on `www.youtube.com` only.
