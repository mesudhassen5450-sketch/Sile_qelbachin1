#!/usr/bin/env bash
cd "$(dirname "$0")"
exec npm run dev -- --webpack -H 127.0.0.1 -p 3000
