{ pkgs, ... }:

let
  # --- 1. CONFIGURATION ---

  # The "Ignore List"
  blackListRegex = "\\.git/|flake\\.lock|result|\\.png$|\\.jpg$|\\.jpeg$|\\.webp$|\\.ico$|\\.appimage$|\\.txt$|LICENSE|ags\\.bak/|\\.bak$|\\.DS_Store|zed\\.nix$";

  # The "Cleaner"
  cleanerSed = "sed '/^[[:space:]]*#/d; /^[[:space:]]*\\/\\//d; /^[[:space:]]*$/d; s/[[:space:]]*$//'";

  # --- 2. RAW TEXT BUILDER ---
  mkRawDump =
    {
      name,
      scopeName,
      filterGreps ? [ ],
    }:
    pkgs.writeShellScriptBin name ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-${scopeName}.txt"
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🤖 Generating ${scopeName} Context (TXT Mode)..."

      # 1. GET FILE LIST & APPLY FILTERS
      FILES=$(git ls-files | grep -vE "${blackListRegex}")

      ${
        if filterGreps != [ ] then
          ''
            FILES=$(echo "$FILES" | grep -E "${builtins.concatStringsSep "|" filterGreps}")
          ''
        else
          ""
      }

      # Sort files
      FILES=$(echo "$FILES" | sort)

      # 2. WRITE HEADER, CONTEXT & MAP
      {
        echo "@META: ${scopeName} dump | Host: $HOSTNAME"
        echo ""

        # --- INJECT CONTEXT.MD IF EXISTS ---
        if [ -f "CONTEXT.md" ]; then
          echo "@CONTEXT_START"
          cat "CONTEXT.md"
          echo "@CONTEXT_END"
          echo ""
        fi
        # -----------------------------------

        echo "@MAP_START"
        echo "$FILES"
        echo "@MAP_END"
        echo ""
      } > "$FINAL_OUTPUT"

      # 3. PROCESS CONTENT (Stateful Stream)
      LAST_DIR=""

      echo "$FILES" | while read -r file; do
        [ -f "$file" ] || continue

        CONTENT=$(${cleanerSed} "$file")

        if [[ -n "$CONTENT" ]]; then
            CURRENT_DIR=$(dirname "$file")
            FILENAME=$(basename "$file")

            if [[ "$CURRENT_DIR" != "$LAST_DIR" ]]; then
                echo "@DIR $CURRENT_DIR" >> "$FINAL_OUTPUT"
                LAST_DIR="$CURRENT_DIR"
            fi

            echo "@FILE $FILENAME" >> "$FINAL_OUTPUT"
            echo "$CONTENT" >> "$FINAL_OUTPUT"
            echo "" >> "$FINAL_OUTPUT"

            echo -n "."
        fi
      done

      echo ""
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      TOKENS=$((BYTES / 3))

      echo "✅ ${scopeName} Dump: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '';

in
{
  home.packages = [
    pkgs.git

    # --- 1. FULL SYSTEM DUMP ---
    (mkRawDump {
      name = "os-dump";
      scopeName = "full";
      filterGreps = [ ];
    })

    # --- 2. RICE DUMP (Visuals Only) ---
    (mkRawDump {
      name = "rice-dump";
      scopeName = "rice";
      filterGreps = [
        "^flake\\.nix$"
        "modules/home/desktop/"
        "modules/home/theme/"
        "\\.css$"
        "\\.scss$"
        "\\.rasi$"
      ];
    })

    # --- 3. HOME DUMP (User Logic) ---
    (mkRawDump {
      name = "home-dump";
      scopeName = "home";
      filterGreps = [
        "^flake\\.nix$"
        "modules/home/"
      ];
    })

    # --- 4. CORE DUMP (System Logic) ---
    (mkRawDump {
      name = "core-dump";
      scopeName = "core";
      filterGreps = [
        "^flake\\.nix$"
        "modules/core/"
        "hosts/"
      ];
    })

    # --- 5. PATH DUMP (Dynamic Folder) ---
    (pkgs.writeShellScriptBin "path-dump" ''
      set -euo pipefail

      # Check if path argument is provided
      if [ $# -eq 0 ]; then
        echo "Usage: path-dump <path>"
        echo "Example: path-dump modules/home/desktop/astal"
        exit 1
      fi

      # Get target path from first argument
      TARGET_PATH="''${1%/}"  # Remove trailing slash if present

      # Find repository root
      if git rev-parse --git-dir > /dev/null 2>&1; then
        REPO_ROOT=$(git rev-parse --show-toplevel)
      else
        REPO_ROOT="."
      fi

      cd "$REPO_ROOT" || exit 1

      # Verify path exists
      if [ ! -e "$TARGET_PATH" ]; then
        echo "❌ Error: Path not found: $TARGET_PATH"
        exit 1
      fi

      # Create safe filename from path
      SAFE_NAME=''${TARGET_PATH//\//-}
      FINAL_OUTPUT="Lis-os-path-''${SAFE_NAME}.txt"

      echo "🤖 Generating path dump for: $TARGET_PATH"

      # Get files based on whether path is file or directory
      if [ -f "$TARGET_PATH" ]; then
        FILES="$TARGET_PATH"
      else
        # Get all files recursively for directory
        if git rev-parse --git-dir > /dev/null 2>&1; then
          FILES=$(git ls-files -- "$TARGET_PATH" 2>/dev/null || git ls-files | grep "^''${TARGET_PATH}/" || echo "")
        else
          FILES=$(find "$TARGET_PATH" -type f 2>/dev/null | sed "s|^$REPO_ROOT/||" || echo "")
        fi
      fi

      # Apply blacklist filter
      BLACK_LIST_REGEX="${blackListRegex}"
      FILES=$(echo "$FILES" | grep -vE "$BLACK_LIST_REGEX" || echo "")

      # Sort files
      FILES=$(echo "$FILES" | sort)

      # Check if any files remain after filtering
      if [ -z "$FILES" ]; then
        echo "⚠️  No files found for path: $TARGET_PATH"
        exit 1
      fi

      # Generate output file
      {
        echo "@META: Path dump for $TARGET_PATH | Host: $HOSTNAME"
        echo ""

        # --- INJECT CONTEXT.MD IF EXISTS ---
        if [ -f "CONTEXT.md" ]; then
          echo "@CONTEXT_START"
          cat "CONTEXT.md"
          echo "@CONTEXT_END"
          echo ""
        fi
        # -----------------------------------

        echo "@MAP_START"
        echo "$FILES"
        echo "@MAP_END"
        echo ""
      } > "$FINAL_OUTPUT"

      # Process each file
      LAST_DIR=""
      echo "$FILES" | while read -r file; do
        [ -f "$file" ] || continue

        CONTENT=$(${cleanerSed} "$file" 2>/dev/null || echo "")

        if [[ -n "$CONTENT" ]]; then
          CURRENT_DIR=$(dirname "$file")
          FILENAME=$(basename "$file")

          if [[ "$CURRENT_DIR" != "$LAST_DIR" ]]; then
            echo "@DIR $CURRENT_DIR" >> "$FINAL_OUTPUT"
            LAST_DIR="$CURRENT_DIR"
          fi

          echo "@FILE $FILENAME" >> "$FINAL_OUTPUT"
          echo "$CONTENT" >> "$FINAL_OUTPUT"
          echo "" >> "$FINAL_OUTPUT"

          echo -n "."
        fi
      done

      echo ""
      BYTES=$(wc -c < "$FINAL_OUTPUT")
      TOKENS=$((BYTES / 3))

      echo "✅ Path Dump: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '')
  ];
}
