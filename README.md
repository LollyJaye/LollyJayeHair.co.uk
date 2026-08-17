# Lolly Jaye Hair — website

A static, multi-page site built from the Canva designs (`Blonding specialist & educator.pdf`) and wired up exactly per `Website Flow Chart.pdf`.

## Opening it

Double-click `index.html` — no server or install needed, it just works in any browser. To edit, open the `website` folder in any code editor.

## Page map (matches the flow chart)

| Page | File | Reached from |
|---|---|---|
| Homepage | `index.html` | — |
| Hair Appointments | `booking.html` | Home → "Book Here" |
| Education overview (4 cards) | `education.html` | Home → "Explore Education" |
| Shadow Days | `shadow-days.html` | Education card |
| → Available Shadow Days | `shadow-days-dates.html` | "See available shadow days" |
| Look & Learn Classes | `look-and-learn.html` | Education card |
| 1:1 Education | `one-to-one.html` | Education card |
| → 1:1 Enquiry form | `enquire-1to1.html` | "Enquire about 1:1 here" |
| Private Classes | `private-classes.html` | Education card |
| Upcoming Classes | `upcoming-classes.html` | Education page bottom button, or "Upcoming Classes" button on Private Classes |
| FAQ | `faq.html` | nav / footer |
| Contact | `contact.html` | nav / footer |

**Note:** `enquire-private.html` (the Private Class enquiry form) still exists and works, but as of the "Upcoming Classes" change nothing links to it anymore — the Private Classes page now points to `upcoming-classes.html` instead, per your call when I flagged the tradeoff. If you want a way back to that enquiry form, easiest fix is adding a link to it from `contact.html` or from `upcoming-classes.html`.

### Editing Upcoming Classes

The data moved out of the page and into `data/upcoming-classes.json`, so it can be edited two ways:

1. **By hand** — open `data/upcoming-classes.json` directly and edit the list. Each entry can be a Look & Learn class (`"ctaType": "tickets"`, links to Instagram) or a Shadow Day / Private Class style enquiry (`"ctaType": "enquire"`, opens a pre-filled email). Set `"open": false` to hide a date without deleting it.
2. **Through the admin panel** — see "Admin panel (Upcoming Classes)" below. This is the one built for the 3 people who'll actually be updating dates day-to-day.

Note: `upcoming-classes.html` now *fetches* that JSON file, which means opening the page by double-clicking it (file://) won't load any dates — browsers block that for local files. It works fine through the local preview server or once deployed, same as always.

Every nav bar and footer is repeated on every page (no template system — it's plain HTML, so edits to nav/footer need to be repeated across files, or ask me and I'll do a find‑and‑replace across all pages in one go).

## Editing Shadow Day dates

Open `shadow-days-dates.html` and scroll to the `<script>` at the bottom — there's a plain array of date objects with comments explaining the fields. Add, remove, or set `open: false` on an entry and save. No build step.

## Forms — how they work right now

The three forms (`contact.html`, `enquire-1to1.html`, `enquire-private.html`) are wired up to send automatically via **Formspree** — a free service that emails form submissions straight to an inbox, no server needed. It's not switched on yet because it needs an account that's tied to your email address, which I can't create for you.

Until you do the 2-minute setup below, the forms still work: they fall back to opening the visitor's own email app with the message pre-filled — including the automatic subject lines from the flow chart (e.g. "1:1 Enquiry Jane Smith"). It's just less reliable, since not every visitor has an email app configured on their device.

### Turning on real email delivery (2 minutes, free)

1. Go to [formspree.io](https://formspree.io) and sign up free with `lolly@lollyjayehair.co.uk` (no credit card).
2. Click **New Form**, name it anything (e.g. "Lolly Jaye Hair — Contact"), and copy the endpoint URL it gives you — it looks like `https://formspree.io/f/abcd1234`.
3. In each of these three files, find the line starting `data-formspree="https://formspree.io/f/YOUR_FORM_ID"` and replace `YOUR_FORM_ID` with your real ID:
   - `contact.html`
   - `enquire-1to1.html`
   - `enquire-private.html`
4. Save. Formspree will send a confirmation email the first time each form is used — click the link in it to activate. After that, every submission lands straight in your inbox with the right subject line, no visitor email app required.

You can reuse the same form ID for all three, or create a separate Formspree form for each if you'd like them to file into different places. The free plan covers 50 submissions/month, which is worth checking against real traffic once the site's live.

## The "Ask" widget (bottom-right chat bubble)

Every page has a round chat button bottom-right. It's a **site search assistant, not a generative AI** — there's no LLM behind it, so it can't hold a real conversation or answer anything outside the site's own content. What it does: matches a visitor's question against `js/search-data.js` (a hand-written summary of each page's real copy) and replies with the closest matching snippet plus a link to that page. Zero cost, zero backend, works offline.

- **To update what it knows:** edit `js/search-data.js` — one object per page with a `title`, `url`, and a `text` summary. Keep it in sync when you change page content (same "no build step" pattern as the dates files).
- **To upgrade to a real AI chatbot** (natural conversation, can answer things not literally on the site): that needs an LLM API key (e.g. OpenAI or Anthropic) and a small backend/serverless function to call it from, since API keys can't safely live in front-end code. It also costs per use. Happy to build that once you've picked a host — just say the word.

## Footer icons

Email and Instagram icon links now sit above the footer nav on every page (`.footer-icons` in `css/style.css`). They point to `mailto:lolly@lollyjayehair.co.uk` and the Instagram profile — update both in one go with find-and-replace across the HTML files if either ever changes.

## Instagram slider (Bookings page)

`booking.html` has an auto-advancing, swipeable image slider under "Follow Along" — arrows and dots on desktop, swipe on mobile, pauses while a visitor's hovering/touching it.

**Important: this is a hand-picked set of images, not a live Instagram feed.** Nothing here updates itself when Lolly posts something new — there's no such thing as a free, zero-setup way to pull "automatically updating" content directly from Instagram's own servers; every option needs at least a one-time connection step. Here's what's actually running today vs. the options to make it genuinely live:

- **Today:** `js/instagram-data.js` is a plain array of `{ image, caption, url }` objects, currently pointing at a few of the photos already used elsewhere on the site. Edit that file by hand to swap in different images — put new files in `/images`, reference them there. Add a `url` to any entry to send that slide to one specific Instagram post (copy the link via "..." → "Copy link" on the post) instead of the profile.
- **To make it genuinely automatic** (pulls Lolly's actual latest posts with no manual editing), pick one:
  1. **Easiest — a free embed widget** (e.g. [SnapWidget](https://snapwidget.com) or [Elfsight](https://elfsight.com)): sign up, connect the Instagram account with one click, choose a "slider" layout, and paste the `<iframe>`/`<script>` snippet they give you in place of the `.ig-slider` block in `booking.html`. About 5 minutes, free tier usually has a small "powered by" watermark.
  2. **More control, more setup — Instagram's own Graph API**: needs Lolly's account to be a Business/Creator account linked to a Facebook Page, a Meta Developer app, and an access token that has to be refreshed roughly every 60 days. Because that token can't safely sit in front-end code, it also needs a small backend/serverless function to fetch posts on the page's behalf. No ongoing cost, no watermark, but it's a real setup project — happy to build it once you've decided on a host for the backend piece.

## Edit Mode (bottom-left pencil button)

Every page has an "Edit" button bottom-left. Turn it on, click any text on the page, and a small panel lets you change its font and colour live.

**Important limit — please read before relying on this:** this is a *local preview tool*, not a real content editor. Changes save to `localStorage` in **your browser only** — they are invisible to everyone else, including Lolly on her own laptop or anyone visiting the live site. There's no way around this without a real backend, because a static site has nowhere shared to save the change to.

- Double-click the Edit button to open "Your local edits" — a plain-text list of every override you've made, with a **Copy list** button. Paste that into a message to your developer (or back to Claude) and it can be made permanent in the actual CSS for all visitors.
- **Clear all** wipes your local edits and reloads the page back to how it looks for everyone else.
- Refreshing the page keeps your edits (they're saved locally); opening the site in a different browser or device won't show them.
- This lives in `js/edit-mode.js` / the `.edit-*` rules in `css/style.css` if you want it removed later.

## Admin panel (Upcoming Classes)

`/admin` is a real, password-protected content editor — not the same thing as Edit Mode above. Logging in and editing "Upcoming Classes" there **does** change the live site for every visitor, because it commits the change to `data/upcoming-classes.json` and triggers a rebuild.

It's built with **Decap CMS** (free, open source) running on **Netlify Identity** for login. The files are already in place (`admin/index.html`, `admin/config.yml`), but it can't work until a few things only you can do are finished — I can't create accounts or invite users on your behalf:

1. **Put the site in a Git repository with `website/` as the root**, and push it to GitHub (a free account works fine). This matters because Decap CMS saves changes as Git commits — a drag-and-drop Netlify deploy (like the one described earlier in this file) has no repository behind it to commit to.
2. **Connect that GitHub repo to Netlify** as a proper "Import from Git" site (not drag-and-drop), with the publish directory set to the repo root.
3. In the Netlify dashboard: **Site configuration → Identity → Enable Identity**.
4. Still under Identity: **Registration → set to "Invite only"** (critical — without this, anyone could sign themselves up).
5. Under Identity → **Services → Git Gateway → Enable Git Gateway** (this is what lets Decap CMS commit on a logged-in user's behalf without them needing their own GitHub account).
6. Under Identity → **Invite users**, send invites to exactly:
   - `kieran@janusgroup.co`
   - `lolly@lollyjayehair.co.uk`
   - `enquiries@lollyjayehair.co.uk`
   
   Each person gets an email, clicks the link, sets a password, and that's their login for `yoursite.com/admin` from then on. Nobody else can get in — Identity only accepts invited emails when registration is set to invite-only.
7. Visit `yoursite.com/admin`, log in, and "Upcoming Classes" will be there to edit — add a date, fill in the fields, hit Publish, and the live site updates within a minute or two (Netlify rebuilds automatically).

Steps 1–2 are a bigger change than the simple drag-and-drop hosting described earlier in this file — happy to walk through converting to a Git-based deploy when you're ready, or do it together.

## What's intentionally NOT built yet

- **Online payments** (3x instalments vs. 100% upfront) and **automated payment reminder emails** — the flow chart flags these as a future phase.
- **Product sales area** (mentioned as "no rush" in the flow chart notes).

These need a real backend (a booking platform like Fresha/Acuity, or custom development with a database and payment processor like Stripe). Worth a conversation about which route makes sense once the site's live and the admin panel above is in regular use.

## Images

Sourced from the raw shoot photos and logo PNGs you provided, resized and compressed for the web (all under ~370KB, most much smaller) so the site loads fast on mobile data — the brief noted ~90% of traffic will be from Instagram links on phones, so the whole layout was built mobile-first to match.
