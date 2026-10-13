# Chrome Web Store listing copy

Copy and paste these into the Developer Dashboard.

## Store listing tab

**Name** (from the manifest): VideoSpace

**Summary** (from the manifest description, ≤132 chars):
Fullscreen YouTube videos open in their own macOS Space, and the tab slides back into its window when you exit.

**Category:** Productivity → Tools
**Language:** English

**Description:**

```
Fullscreen a YouTube video without dragging your whole window into fullscreen.

On macOS, Chrome normally takes the entire window (every tab in it) into a fullscreen Space. VideoSpace moves only the video's tab into its own Space, so your window and all its other tabs stay right where they are on your desktop.

HOW IT WORKS
• Click fullscreen on any YouTube video (or press F).
• The video zooms into its own macOS Space with the native animation.
• Swipe between the video and your desktop like any other Space.
• Press Esc and the video zooms back onto your window. The tab returns to the same position, with its pinned state and tab group restored.

LIGHTWEIGHT BY DESIGN
• Does nothing until you fullscreen a video. No background activity, polling or timers.
• Under 20 KB installed.
• No accounts, no settings, no tracking, no network requests.

PRIVACY
VideoSpace does not collect, store or transmit any personal data. The only thing it remembers is a small, temporary note of where the tab came from so it can put it back. That note is kept in memory and cleared when Chrome closes.

Works on YouTube (www.youtube.com). Designed for macOS.
```

**Graphic assets:**
- Store icon: `icons/icon-128.png`
- Screenshot: `store/screenshot-1280x800.png` (you can add up to 5; a real screenshot of your desktop with a video in its own Space works well as a second one)
- Small promo tile: `store/promo-440x280.png`

## Privacy practices tab

**Single purpose:**
```
VideoSpace moves a fullscreen YouTube video's tab into its own window so it gets its own macOS fullscreen Space, then returns the tab to its original window when fullscreen ends.
```

**Permission justification: storage**
```
Uses chrome.storage.session to remember, for the duration of one fullscreen session, which window and position the tab came from so it can be returned there. Nothing is written to disk or synced.
```

**Host permission justification (content scripts on https://www.youtube.com/*)**
```
The content scripts detect when the YouTube player requests fullscreen so the extension can move that tab into its own window first. They do not read or modify page content and send no data anywhere.
```

**Are you using remote code?** No, I am not using remote code.

**Data usage:** don't tick any of the data categories. Tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** host `store/privacy-policy.md` (for example as a GitHub Gist or GitHub Pages page) and paste the URL.
