# In modules/home/packages.nix
{ pkgs, ... }:
{
  home.packages = with pkgs; [
    # ... your existing packages ...

    # Generic LLM dump script (works in ANY git repo)
    (writeShellScriptBin "llm-dump-generic" ''
      set -euo pipefail

      # Get current directory name
      FOLDER_NAME=$(basename "$(pwd)")
      FINAL_OUTPUT="''${FOLDER_NAME}-dump.txt"  # <-- NOTICE: $ becomes ''$

      # Ensure we're in a git repo
      if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ Error: Not in a git repository"
        exit 1
      fi

      # Get repo root
      REPO_ROOT=$(git rev-parse --show-toplevel)
      cd "$REPO_ROOT"

      echo "🤖 Generating Dense Context: $FINAL_OUTPUT"

      # JSONL header
      echo '{"_meta":{"date":"'$(date '+%Y-%m-%d')'","note":"Format: JSONL"},"protocol":["ANALYZE","DISCUSS","IMPLEMENT"]}' > "$FINAL_OUTPUT"

      # Dump files (generic ignore patterns)
      git ls-files | \
      grep -vE "\.git/|flake\.lock|result|\.png$|\.jpg$|\.jpeg$|\.webp$|\.ico$|\.xml$|\.md$|LICENSE|$FINAL_OUTPUT" | \
      while read -r file; do
        [ -f "$file" ] || continue

        # Skip files larger than 100KB
        [ "$(wc -c < "$file")" -gt 102400 ] && continue

        # Minify: remove comments, empty lines, trailing whitespace
        content=$(sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d; s/[[:space:]]*$//' "$file")

        if [[ -n "$content" ]]; then
          jq -n -c --arg p "$file" --arg c "$content" '{"p":$p,"c":$c}' >> "$FINAL_OUTPUT"
        fi
        echo -n "."
      done

      echo ""
      echo "✅ Done: $REPO_ROOT/$FINAL_OUTPUT"

      # Stats
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      echo "📊 Size: $(($BYTES / 1024)) KB | ~$(($BYTES / 3 / 4)) Tokens"
    '')
  ];
}

#echo '{"_meta":{"date":"'$(date +%Y-%m-%d)'"}}' > dump.jsonl; for f in *.rasi RofiLauncher Clipboard; do [ -f "$f" ] && jq -cn --arg p "$f" --arg c "$(cat "$f")" '{"p":$p,"c":$c}' >> dump.jsonl && echo "✓ $f"; done; echo "✅ $(wc -c < dump.jsonl) bytes"
