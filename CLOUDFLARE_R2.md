# Cloudflare R2 media (playback source)

Production audio, PDF, video, and remote covers are served from **Cloudflare R2**, not GitHub or jsDelivr.

## Public (browser-safe)

| Item | Value |
|------|--------|
| Public base | `https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev` |
| Object prefix | `sileqelbachin-meadia` |
| Env | `NEXT_PUBLIC_R2_PUBLIC_BASE`, `NEXT_PUBLIC_R2_OBJECT_PREFIX` |

URL shape:

```text
{PUBLIC_BASE}/{OBJECT_PREFIX}/{encodeURIComponent(each/path/segment)}
```

Example (`intebih5.m4a`):

```text
https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev/sileqelbachin-meadia/files/Intebih%20Ante%20Murakeb%20(intebih-ante-murakeb)/intebih5.m4a
```

Website resolver: `src/lib/mediaUrl.ts` (`resolveMediaUrl`, `resolvePdfEmbedUrl`, `mediaFileUrl`).

- Rewrites legacy `raw.githubusercontent.com`, `media.githubusercontent.com`, and `cdn.jsdelivr.net/gh/.../sileqelbachin-media@...` URLs to R2.
- Keeps local assets under `/covers/`, `/logo`, etc.
- Strips `telegram_media/` and applies the `Ad-Da'` → `Ad-Da_` folder alias.

## Private (docs / upload scripts only — never commit real secrets)

| Item | Value (docs) |
|------|----------------|
| Account ID | `26e435690c62468180455b796d21b3ab` |
| Bucket | `sileqelbachinmediea` |
| Env placeholders | `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` |

Do **not** put Access Keys in client code or any `NEXT_PUBLIC_*` variable.

## Archive

The GitHub repo `sileqelbachin-media` remains an **optional archive / backup**. Playback for the live site and Flutter handoff should use R2.

## Netlify / deploy

Set the two `NEXT_PUBLIC_R2_*` vars (defaults work if unset). Optional private R2 vars belong only in CI upload jobs, not in the Next.js browser bundle.
