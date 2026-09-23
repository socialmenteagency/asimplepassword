#!/bin/bash
# Judge one prompt with a second NaN model. Writes .txt only on success, so reruns retry failures.
f="$1"; o="${f%.prompt}.txt"
[ -s "$o" ] && exit 0
if perl -e 'alarm 300; exec @ARGV' opencode run --agent plan -m nan/deepseek-v4-flash "$(cat "$f")" > "$o.part" 2>&1; then mv "$o.part" "$o"; else echo "FAIL $f" >&2; fi
