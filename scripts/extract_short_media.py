#!/usr/bin/env python3
"""
Probe video/audio in content.json via ffprobe (R2 URLs).
Write:
  - src/data/mediaDurations.json  — id → seconds for all media
  - src/data/oneMinuteCatalog.json — items with duration ≤ 60s for /one-minute
"""

from __future__ import annotations

import concurrent.futures
import json
import subprocess
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "src" / "data" / "content.json"
OUT_DURATIONS = ROOT / "src" / "data" / "mediaDurations.json"
OUT_ONE_MINUTE = ROOT / "src" / "data" / "oneMinuteCatalog.json"

R2_BASE = "https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev/sileqelbachin-meadia"
SHORT_MAX = 60.0
WORKERS = 10
TIMEOUT = 45


def build_url(relative: str) -> str:
    path = relative.lstrip("/")
    if path.startswith("telegram_media/"):
        path = path[len("telegram_media/") :]
    encoded = "/".join(urllib.parse.quote(seg) for seg in path.split("/") if seg != "")
    return f"{R2_BASE}/{encoded}"


def probe_duration(url: str) -> float | None:
    try:
        proc = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
        raw = (proc.stdout or "").strip()
        if not raw:
            return None
        seconds = float(raw)
        if seconds > 0 and seconds < 24 * 3600:
            return seconds
    except Exception:
        return None
    return None


def loc(item: dict) -> dict:
    title = item.get("title") or {}
    if isinstance(title, str):
        return {"am": title, "en": title, "ar": title}
    return {
        "am": title.get("am") or title.get("en") or item.get("rawFilename") or "",
        "en": title.get("en") or title.get("am") or item.get("rawFilename") or "",
        "ar": title.get("ar") or title.get("en") or title.get("am") or "",
    }


def desc(item: dict) -> dict:
    d = item.get("description") or {}
    if isinstance(d, str):
        return {"am": d, "en": d, "ar": d}
    return {
        "am": d.get("am") or d.get("en") or "",
        "en": d.get("en") or d.get("am") or "",
        "ar": d.get("ar") or d.get("en") or "",
    }


def work(item: dict) -> tuple[str, float | None, dict]:
    mid = str(item.get("id") or "")
    rel = item.get("fileUrl") or ""
    url = build_url(rel) if rel else ""
    seconds = probe_duration(url) if url else None
    return mid, seconds, item


def main() -> int:
    data = json.loads(CONTENT.read_text(encoding="utf-8"))
    media = [x for x in data if x.get("type") in ("video", "audio") and x.get("fileUrl")]
    print(f"Probing {len(media)} media files (≤{SHORT_MAX}s → one-minute)…", flush=True)

    durations: dict[str, float] = {}
    shorts: list[dict] = []
    done = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(work, item) for item in media]
        for fut in concurrent.futures.as_completed(futures):
            mid, seconds, item = fut.result()
            done += 1
            if done % 25 == 0 or done == len(media):
                print(f"  {done}/{len(media)}…", flush=True)
            if mid and seconds is not None:
                durations[mid] = round(seconds, 3)
            if seconds is None or seconds <= 0 or seconds > SHORT_MAX:
                continue
            kind = "video" if item.get("type") == "video" else "audio"
            raw_name = (item.get("rawFilename") or "").lower()
            # Skip Telegram stickers / tiny animated emoji packs
            if "sticker" in raw_name:
                continue
            if kind == "video" and seconds < 1.5:
                continue
            rel = item.get("fileUrl") or ""
            shorts.append(
                {
                    "id": f"om-{mid}",
                    "sourceId": mid,
                    "kind": kind,
                    "title": loc(item),
                    "body": desc(item),
                    "mediaUrl": build_url(rel),
                    "coverUrl": None,
                    "soundUrl": None,
                    "durationSeconds": round(seconds, 3),
                    "category": item.get("category") or "",
                    "rawFilename": item.get("rawFilename") or "",
                    "updatedAt": item.get("date") or None,
                }
            )

    shorts.sort(key=lambda s: (0 if s["kind"] == "video" else 1, s["durationSeconds"]))

    OUT_DURATIONS.write_text(
        json.dumps(
            {
                "generatedBy": "scripts/extract_short_media.py",
                "shortMaxSeconds": SHORT_MAX,
                "count": len(durations),
                "durations": durations,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    OUT_ONE_MINUTE.write_text(
        json.dumps(
            {
                "generatedBy": "scripts/extract_short_media.py",
                "shortMaxSeconds": SHORT_MAX,
                "count": len(shorts),
                "videoCount": sum(1 for s in shorts if s["kind"] == "video"),
                "audioCount": sum(1 for s in shorts if s["kind"] == "audio"),
                "items": shorts,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        f"Done. durations={len(durations)} shorts={len(shorts)} "
        f"(video={sum(1 for s in shorts if s['kind']=='video')} "
        f"audio={sum(1 for s in shorts if s['kind']=='audio')})",
        flush=True,
    )
    print(f"Wrote {OUT_DURATIONS}")
    print(f"Wrote {OUT_ONE_MINUTE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
