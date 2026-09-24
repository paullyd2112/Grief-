# Ndo landing page

The public marketing site. Next.js on Vercel, the same stack as `admin/`.

It is a separate app rather than a route inside `admin/` (as DECISIONS.md D6
first suggested): the admin console gates every request behind the operator
login in `src/proxy.ts`, and keeping the public site off that deployment means
the marketing domain never serves the operator console.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Settings

Both are optional; see `.env.example`.

- `NEXT_PUBLIC_APP_STORE_URL` — once set, the "Coming soon to iPhone" label
  becomes a download button.
- `NEXT_PUBLIC_SUPPORT_EMAIL` — shown in the footer.

## Copy

- The privacy promise is quoted word for word from `docs/ACCESS_POLICY.md`.
  Change it there first.
- Crisis resources match the app's crisis screen.
- Don't add claims about pricing, availability or features until they're true.

## Before launch

- Privacy policy and terms pages (after the lawyer review in BUILD_PLAN.md);
  the App Store needs both URLs, plus a support URL.
- Favicon, app icon and social share image, once the wordmark is final.
- Domain (DECISIONS.md O5).
