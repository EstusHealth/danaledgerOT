# Dana Ledger OT

Telehealth occupational therapy for late-diagnosed women, chronic invisible
conditions, and the guilt that comes with both.

Plain HTML/CSS/JS, so there's no build step. Deploys to Vercel as-is.

## Pages

| URL               | File                  | Notes                                         |
| ----------------- | --------------------- | --------------------------------------------- |
| `/`               | `index.html`          | Landing page                                  |
| `/session-recap`  | `session-recap.html`  | Private session recap (noindex, not linked)   |

## Turning on Google Calendar booking

1. Google Calendar → **Create → Appointment schedule** → set up a 15-min "Welcome chat".
2. Open it → **Share**.
3. Copy the **booking page** link into `bookingUrl` in `assets/site.js`.
4. Optional: choose **Website embed**, copy the `src="…"` address from the iframe
   code into `bookingEmbedUrl`, and the calendar shows inline on the page.

Every "Book a welcome chat" button picks it up automatically.

## Still to fill in

Placeholders are shown with a yellow striped highlight (`class="todo"`) in
`index.html`. Search for `todo` to find them all:

- email and phone
- AHPRA registration number
- session fee and Medicare details
- welcome chat and session lengths
- cancellation policy

## Local preview

```bash
npx serve .        # or: python3 -m http.server
```
