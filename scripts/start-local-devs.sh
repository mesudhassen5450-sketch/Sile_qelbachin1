#!/usr/bin/env bash
# Start website (:3000) + Admin (:3001) on THIS machine's loopback.
# Run from a normal system Terminal (outside Cursor Agent sandbox).
set -euo pipefail
WEB="/home/mhm/Documents/website folder/Sile_qelbachin1"
ADMIN="$WEB/admincn-1.0.0"
mkdir -p "$WEB/.data"

# Stop previous copies
pkill -f "$WEB/node_modules/next/dist/bin/next" 2>/dev/null || true
pkill -f "$ADMIN/node_modules/next/dist/bin/next" 2>/dev/null || true
sleep 1
rm -f "$WEB/.next/dev/lock" "$ADMIN/.next/dev/lock"

cd "$WEB"
nohup "$WEB/node_modules/next/dist/bin/next" dev -p 3000 -H 127.0.0.1 --webpack \
  > "$WEB/.data/web-dev.log" 2>&1 &
echo $! > "$WEB/.data/web-dev.pid"

cd "$ADMIN"
nohup env NEXT_PRIVATE_DEV_DIR="$ADMIN" "$ADMIN/node_modules/next/dist/bin/next" \
  dev -p 3001 -H 127.0.0.1 --webpack > "$WEB/.data/admin-dev.log" 2>&1 &
echo $! > "$WEB/.data/admin-dev.pid"

echo "Starting… (first compile can take ~15s)"
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  if curl -sf -o /dev/null --connect-timeout 1 http://127.0.0.1:3000/ 2>/dev/null; then
    break
  fi
done

echo
curl -s -o /dev/null -w "Website  http://127.0.0.1:3000  → HTTP %{http_code}\n" http://127.0.0.1:3000/ || echo "Website  FAILED"
curl -s -o /dev/null -w "Admin    http://127.0.0.1:3001  → HTTP %{http_code}\n" http://127.0.0.1:3001/ || echo "Admin    FAILED"
echo
echo "Logs: $WEB/.data/web-dev.log"
echo "      $WEB/.data/admin-dev.log"
echo "Open: http://127.0.0.1:3000"
