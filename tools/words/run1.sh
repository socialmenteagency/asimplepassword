#!/bin/bash
f="$1"; o="${f%.prompt}.txt"
[ -s "$o" ] && exit 0
perl -e 'alarm 300; exec @ARGV' opencode run --agent plan -m nan/deepseek-v4-flash "$(cat "$f")" > "$o" 2>&1 || echo "FAIL $f" >&2
