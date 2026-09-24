#!/usr/bin/env bash
# Compares every deployed file with this repo's copy in site/. Exits 1 if any differs.
# Run from the repo root. Used by .github/workflows/live-check.yml (daily) and after each deploy.
# Skipped: .htaccess (not fetchable over HTTP; check it with cPanel Fileman::get_file_content)
# and og.jpg (served from jsDelivr, not from the site).
set -u
base="https://asimplepassword.com"
fail=0
for f in $(git ls-files site | sed 's|^site/||' | grep -vE '^(\.htaccess|og\.jpg)$'); do
  if curl -sf --max-time 30 "$base/$f" | cmp -s - "site/$f"; then
    echo "ok   $f"
  else
    echo "DIFF $f"; fail=1
  fi
done
# The design proposal was taken offline on 24-sep-2026; it loads third-party scripts.
for f in index2.html index2.js index2.css; do
  code=$(curl -s -o /dev/null --max-time 30 -w '%{http_code}' "$base/$f")
  [ "$code" = 404 ] && echo "ok   $f is gone" || { echo "LIVE $f ($code)"; fail=1; }
done
exit $fail
