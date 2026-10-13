# Publishing VideoSpace to the Chrome Web Store

All the listing text you need is in `store/listing.md`, ready to paste.

## 1. One-time setup

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) and sign in with the Google account you want to publish under. A dedicated account is a good idea, since you can't move items between accounts later.
2. Accept the developer agreement and pay the **one-time $5 registration fee**.
3. **Account** tab:
   - Set a publisher display name (this shows on the listing).
   - Add and **verify a contact email**. You can't publish until it's verified.
   - Answer the **trader / non-trader** declaration (EU Digital Services Act). For a free hobby extension, "non-trader" is usually right.
4. Make sure **2-Step Verification** is turned on for the Google account. It's required to publish.

## 2. Host the privacy policy

1. Open `store/privacy-policy.md` and replace `YOUR_CONTACT_EMAIL` with the address you want to show publicly.
2. Publish it somewhere with a public URL:
   - **GitHub Gist:** create a public gist, paste the file and copy the URL.
   - **GitHub Pages:** if the repo is public, enable Pages and use the file's URL.

## 3. Build the upload package

```sh
npm install
npm run package
```

This runs the typecheck and tests, builds `dist/` and creates `videospace-1.0.0.zip` in the project root. That zip is what you upload. Don't zip the project folder itself.

Optional final check: load `dist/` with **Load unpacked** in `chrome://extensions`, fullscreen a YouTube video from a window with several tabs, press Esc and confirm the tab comes back.

## 4. Create the item

1. In the dashboard, click **New item** and upload `videospace-1.0.0.zip`.
2. **Store listing** tab (copy from `store/listing.md`):
   - Description, category (**Productivity → Tools**), language (**English**).
   - Store icon: `icons/icon-128.png`
   - Screenshots: `store/screenshot-1280x800.png`. Adding a second, real screenshot is a good idea: take a 1280×800 capture of your desktop with a video in its own Space, or of Mission Control showing the extra Space.
   - Small promo tile: `store/promo-440x280.png`
   - Optional: a homepage URL (e.g. the GitHub repo) and a support URL.
3. **Privacy practices** tab (copy from `store/listing.md`):
   - Single purpose description
   - Justifications for `storage` and the host permission (`https://www.youtube.com/*`)
   - Remote code: **No**
   - Data usage: no categories ticked, all three certifications ticked
   - Privacy policy URL from step 2
4. **Distribution** tab:
   - Visibility: **Public** (anyone can find it), or **Unlisted** (only people with the link). Unlisted is a good way to soft-launch.
   - Regions: all regions, unless you want to limit it.
   - Pricing: free.

## 5. Submit

Click **Submit for review**. You can choose to publish automatically once it's approved, or publish manually later.

- Review usually takes **a few days**, sometimes longer for new developer accounts.
- You'll get an email when it's approved or rejected. Rejections explain the reason; fix it and resubmit.

### Common rejection reasons (already addressed)

| Reason | Status |
| --- | --- |
| Requesting permissions it doesn't need | Only `storage` plus content scripts on youtube.com |
| Missing or vague single-purpose statement | Provided in `store/listing.md` |
| Trademark use in the name or icon | Name and icon are original; "YouTube" only appears in the description, to say where it works |
| Missing privacy disclosures | Privacy tab answers and a privacy policy are provided |
| Obfuscated code | The code is minified, not obfuscated, which is allowed |

## 6. Shipping updates

1. Bump `"version"` in `package.json` (e.g. `1.0.1`). The build copies it into the manifest. Every upload needs a higher version than the last one.
2. Run `npm run package`.
3. Dashboard → your item → **Package** → **Upload new package** → upload the new zip → **Submit for review**.

Users get the update automatically within a few hours of approval.

## Regenerating the artwork

Edit `assets/icon.svg` (or `assets/icon-16.svg` for the tiny toolbar size) and run `npm run assets`. This re-renders `icons/*.png` and the store images in `store/`.
