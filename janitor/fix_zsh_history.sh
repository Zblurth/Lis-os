#!/usr/bin/env bash
# Repair corrupt Zsh history file
set -e

HISTFILE="$HOME/.local/share/zsh/history"

echo "🔍 Checking history file..."
if [ ! -f "$HISTFILE" ]; then
    echo "❌ No history file found at $HISTFILE"
    exit 1
fi

echo "📦 Backing up corrupt file to ${HISTFILE}_bad_$(date +%s)..."
cp "$HISTFILE" "${HISTFILE}_bad_$(date +%s)"

echo "🛠️  Stripping binary characters..."
# Move original aside to force new creation
mv "$HISTFILE" "${HISTFILE}.tmp.corrupt"
cat "${HISTFILE}.tmp.corrupt" | tr -cd '\11\12\15\40-\176' > "$HISTFILE"

echo "✅ History file rebuilt."
echo "   Original lines: $(wc -l < "${HISTFILE}.tmp.corrupt")"
echo "   Recovered lines: $(wc -l < "$HISTFILE")"

rm "${HISTFILE}.tmp.corrupt"
