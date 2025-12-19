{ pkgs, ... }:

let
  # --- 1. CONFIGURATION ---

  # The "Ignore List"
  blackListRegex = "\\.git/|node_modules/|flake\\.lock|result|\\.png$|\\.jpg$|\\.jpeg$|\\.webp$|\\.ico$|\\.appimage$|\\.txt$|LICENSE|ags\\.bak/|\\.bak$|\\.DS_Store|zed\\.nix$";

  # Lean blacklist - for NixOS config only (excludes heavy dev folders)
  leanBlackListRegex = "${blackListRegex}|desktop/astal|noctalia-debug|sessions/|\\.md$|\\.tsx$|\\.ts$|\\.js$|\\.css$|\\.scss$|\\.json$|bundle\\.js|package\\.json|tsconfig|astal_legacy";

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
    # --- 5. LEAN DUMP (NixOS Config Only - No Heavy Folders) ---
    (pkgs.writeShellScriptBin "lean-dump" ''
      set -euo pipefail
      FINAL_OUTPUT="Lis-os-lean.txt"
      REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
      cd "$REPO_ROOT" || exit 1

      echo "🤖 Generating LEAN NixOS Config Dump..."

      # Get files, apply LEAN blacklist (excludes astal, noctalia-debug, md, ts, etc)
      LEAN_BLACKLIST="${leanBlackListRegex}"
      FILES=$(git ls-files | grep -vE "$LEAN_BLACKLIST" | sort)

      if [ -z "$FILES" ]; then
        echo "❌ No files found after filtering."
        exit 1
      fi

      # Count files
      FILE_COUNT=$(echo "$FILES" | wc -l)
      echo "📁 Found $FILE_COUNT files (after lean filtering)"

      # Write output
      {
        echo "@META: LEAN NixOS Config | Host: $HOSTNAME"
        echo "@PURPOSE: Portable config reference for Arch/dcli migration"
        echo ""

        # Inject GEMINI context
        if [ -f "janitor/GEMINI.md" ]; then
          echo "@GEMINI_START"
          cat "janitor/GEMINI.md"
          echo "@GEMINI_END"
          echo ""
        fi

        echo "@MAP_START"
        echo "$FILES"
        echo "@MAP_END"
        echo ""
      } > "$FINAL_OUTPUT"

      # Process content
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

      echo "✅ Lean Dump: $REPO_ROOT/$FINAL_OUTPUT"
      echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '')

    # --- 6. PATH DUMP (Dynamic Folder) ---
    (pkgs.writeShellScriptBin "path-dump" ''
            set -euo pipefail

            # Check if arguments are provided
            if [ $# -eq 0 ]; then
              echo "Usage: path-dump <path1> [path2] ..."
              echo "Example: path-dump modules/home/desktop/astal janitor"
              exit 1
            fi

            # Find repository root
            if git rev-parse --git-dir > /dev/null 2>&1; then
              REPO_ROOT=$(git rev-parse --show-toplevel)
            else
              REPO_ROOT="."
            fi

            cd "$REPO_ROOT" || exit 1

            # --- COLLECT FILES FROM ALL PATHS ---
            ALL_FILES=""
            SAFE_NAME_PARTS=""

            for TARGET_PATH in "$@"; do
                # Remove trailing slash
                TARGET_PATH="''${TARGET_PATH%/}"

                if [ ! -e "$TARGET_PATH" ]; then
                   echo "⚠️ Warning: Path not found: $TARGET_PATH"
                   continue
                fi

                # Safe name for output file
                PART_NAME=''${TARGET_PATH//\//-}
                SAFE_NAME_PARTS="''${SAFE_NAME_PARTS}-''${PART_NAME}"

                echo "🔍 Scanning: $TARGET_PATH"

                # Get files
                if [ -f "$TARGET_PATH" ]; then
                   FOUND="$TARGET_PATH"
                else
                   if git rev-parse --git-dir > /dev/null 2>&1; then
                     FOUND=$(git ls-files -- "$TARGET_PATH" 2>/dev/null || git ls-files | grep "^''${TARGET_PATH}/" || echo "")
                   else
                     FOUND=$(find "$TARGET_PATH" -type f 2>/dev/null | sed "s|^$REPO_ROOT/||" || echo "")
                   fi
                fi
                
                # Append to ALL_FILES (newline separated)
                if [ -n "$FOUND" ]; then
                   ALL_FILES="''${ALL_FILES}
      ''${FOUND}"
                fi
            done

            # Clean up file list (trim empty lines, sort, unique)
            FILES=$(echo "$ALL_FILES" | grep -v "^$" | sort | uniq)

            # Apply blacklist filter
            BLACK_LIST_REGEX="${blackListRegex}"
            FILES=$(echo "$FILES" | grep -vE "$BLACK_LIST_REGEX" || echo "")

            if [ -z "$FILES" ]; then
              echo "❌ No files found in specified paths."
              exit 1
            fi

            # Output Filename
            FINAL_OUTPUT="Lis-os-dump''${SAFE_NAME_PARTS}.txt"

            echo "🤖 Generating dump..."

            # --- GENERATE OUTPUT ---
            {
              echo "@META: Multi-Path Dump | Host: $HOSTNAME"
              echo "@PATHS: $*"
              echo ""

              # --- A. INJECT GEMINI.MD (PRIORITY) ---
              if [ -f "janitor/GEMINI.md" ]; then
                 echo "found GEMINI.md, injecting..." >&2
                 echo "@GEMINI_START"
                 cat "janitor/GEMINI.md"
                 echo "@GEMINI_END"
                 echo ""
              fi

              # --- B. INJECT CONTEXT.MD (FALLBACK/ADDITIONAL) ---
              if [ -f "CONTEXT.md" ]; then
                echo "@CONTEXT_START"
                cat "CONTEXT.md"
                echo "@CONTEXT_END"
                echo ""
              fi

              echo "@MAP_START"
              echo "$FILES"
              echo "@MAP_END"
              echo ""
            } > "$FINAL_OUTPUT"

            # --- PROCESS CONTENT ---
            LAST_DIR=""
            
            # We iterate over the file list string
            echo "$FILES" | while read -r file; do
              [ -f "$file" ] || continue

              # 1. CHECK LINE COUNT
              LINES=$(wc -l < "$file")
              
              CURRENT_DIR=$(dirname "$file")
              FILENAME=$(basename "$file")

              # Dir Header
              if [[ "$CURRENT_DIR" != "$LAST_DIR" ]]; then
                  echo "@DIR $CURRENT_DIR" >> "$FINAL_OUTPUT"
                  LAST_DIR="$CURRENT_DIR"
              fi

              echo "@FILE $FILENAME" >> "$FINAL_OUTPUT"

              if [ "$LINES" -gt 1000 ]; then
                   # 2. LARGE FILE HANDLING
                   echo "[IGNORED: File too large ($LINES lines). Path: $file]" >> "$FINAL_OUTPUT"
                   echo "" >> "$FINAL_OUTPUT"
                   echo -n "S" # Skip indicator
              else
                   # 3. NORMAL CONTENT
                   CONTENT=$(${cleanerSed} "$file" 2>/dev/null || echo "")
                   if [[ -n "$CONTENT" ]]; then
                     echo "$CONTENT" >> "$FINAL_OUTPUT"
                     echo "" >> "$FINAL_OUTPUT"
                     echo -n "."
                   fi
              fi

            done

            echo ""
            BYTES=$(wc -c < "$FINAL_OUTPUT")
            TOKENS=$((BYTES / 3))

            echo "✅ Dump Created: $REPO_ROOT/$FINAL_OUTPUT"
            echo "📊 Size: $(($BYTES / 1024)) KB (~$TOKENS Tokens)"
    '')
  ];
}
