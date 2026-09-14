#!/usr/bin/env bash
# Push new kitab audio/PDF/covers into sileqelbachin-media.
# Auth: GH_TOKEN env, or gh auth login (repo write).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="${TMPDIR:-/tmp}/sileqelbachin-media-push-$$"
INTEBIH_DIR='files/Intebih Ante Murakeb (intebih-ante-murakeb)'
ADEWA_DIR='files/Ad-Da_ wa Ad-Dawa_ (adewae-kitab)'
REPO='https://github.com/mesudhassen5450-sketch/sileqelbachin-media.git'

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

if [[ ! -f "$ROOT/public/intebih5.m4a" || ! -f "$ROOT/public/muktasar.pdf" ]]; then
  echo "Missing public/intebih5.m4a or public/muktasar.pdf" >&2
  exit 1
fi

mkdir -p "$TMP"
cd "$TMP"

if [[ -n "${GH_TOKEN:-}" ]]; then
  git clone --depth 1 "https://x-access-token:${GH_TOKEN}@github.com/mesudhassen5450-sketch/sileqelbachin-media.git"
else
  git clone --depth 1 "$REPO"
fi
cd sileqelbachin-media

mkdir -p "$INTEBIH_DIR" "$ADEWA_DIR"
cp -f "$ROOT/public/intebih5.m4a" "$INTEBIH_DIR/intebih5.m4a"
cp -f "$ROOT/public/muktasar.pdf" "$ADEWA_DIR/muktasar.pdf"

if [[ -f "$ROOT/public/covers/adewae-kitab.jpeg" ]]; then
  cp -f "$ROOT/public/covers/adewae-kitab.jpeg" "$ADEWA_DIR/adewae-kitab.jpeg"
fi
if [[ -f "$ROOT/public/dawa dawa.jpeg" ]]; then
  cp -f "$ROOT/public/dawa dawa.jpeg" "$ADEWA_DIR/dawa-dawa.jpeg"
fi

git add \
  "$INTEBIH_DIR/intebih5.m4a" \
  "$ADEWA_DIR/muktasar.pdf" \
  "$ADEWA_DIR/adewae-kitab.jpeg" \
  "$ADEWA_DIR/dawa-dawa.jpeg" 2>/dev/null || true

git status
if git diff --cached --quiet; then
  echo "No media changes to commit."
  exit 0
fi

git commit -m "$(cat <<'EOF'
Add Intebih part 5 audio, Adewa muktasar PDF, and covers.

EOF
)"

git push origin HEAD
echo "Media push done."
