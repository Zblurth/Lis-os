{ pkgs, ... }:
let
  red = "\\033[0;31m";
  green = "\\033[0;32m";
  blue = "\\033[0;34m";
  reset = "\\033[0m";
  configDir = "~/Lis-os";
in
{
  home.packages = [
  # --- Fast Rebuild (fr) ---
    (pkgs.writeShellScriptBin "fr" ''
      set -e
      echo -e "${blue}📦 Staging all changes...${reset}"
      cd ${configDir} || exit
      git add .

      # Check for backup files that often break Home Manager
      echo -e "${blue}🔍 Checking for backup files...${reset}"
      if backups=$(find "$HOME/.config" -name "*.backup" -type f 2>/dev/null); then
          if [ -n "$backups" ]; then
              echo -e "${red}⚠️  Found backup files that might cause conflicts:${reset}"
              echo "$backups"
              echo
              read -p "🗑️  Delete these files? [y/N] " response
              if [[ "$response" =~ ^[yY]$ ]]; then
                  echo "$backups" | xargs rm -v
                  echo -e "${green}✅ Backups deleted.${reset}"
              else
                  echo -e "${blue}ℹ️  Skipping deletion. Rebuild might fail.${reset}"
              fi
          fi
      fi

      echo -e "${blue}🚀 Rebuilding NixOS...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os switch .

      if command -v niri &> /dev/null; then
        echo -e "${blue}🔍 Validating Niri...${reset}"
        niri validate || echo -e "${red}⚠️ Niri config issues detected${reset}"
      fi

      if pgrep -x quickshell &> /dev/null; then
        echo -e "${blue}🔄 Refreshing Noctalia Shell...${reset}"
        pkill -x quickshell || true
        (noctalia-shell & disown) &> /dev/null
      fi
    '')

    # --- Update OS (up-os) ---
    (pkgs.writeShellScriptBin "up-os" ''
      set -e
      echo -e "${blue}📦 Staging all changes...${reset}"
      cd ${configDir} || exit
      git add .

      echo -e "${blue}🔄 Fetching flake updates...${reset}"
      nix flake update
      git add flake.lock

      echo -e "${blue}🚀 Rebuilding System...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os switch .

      echo -e "${green}🎉 System updated successfully!${reset}"

      if pgrep -x quickshell &> /dev/null; then
        echo -e "${blue}🔄 Refreshing Noctalia Shell...${reset}"
        pkill -x quickshell || true
        (noctalia-shell & disown) &> /dev/null
      fi
    '')

    # --- Test OS (test-os) ---
    (pkgs.writeShellScriptBin "test-os" ''
      set -e
      echo -e "${blue}🧪 STARTING TEST RUN (Ephemeral)...${reset}"
      cd ${configDir} || exit

      echo -e "${blue}🧹 Cleaning old backups...${reset}"
      find "$HOME/.config" -name "*.backup" -delete

      echo -e "${blue}📦 Staging changes...${reset}"
      git add .

      echo -e "${blue}🔨 Building and Activating Test Environment...${reset}"
      NIX_CONFIG="warn-dirty = false" nh os test .

      echo -e "${green}✅ Test Environment Active!${reset}"
      echo -e "${blue}ℹ️  NOTE: Changes are live but NOT permanent.${reset}"
      echo -e "${blue}ℹ️  Reboot your PC to discard these changes.${reset}"
    '')

    # --- CLEAN OS ---
    (pkgs.writeShellScriptBin "clean-os" ''
      echo -e "${blue}🧹 System Garbage Collection${reset}"
      read -p "Keep how many recent generations? (Recommended: 3-5): " keep_num
      if [[ ! "$keep_num" =~ ^[0-9]+$ ]]; then
          echo -e "${red}❌ Invalid number.${reset}"
          exit 1
      fi

      echo -e "${blue}🗑️  Deleting old generations...${reset}"
      nh clean all --keep "$keep_num"

      echo -e "${blue}🗜️  Optimizing Store (Deduplicating files)...${reset}"
      echo "This might take a while..."
      nix-store --optimise

      echo -e "${green}✨ System Cleaned & Optimized!${reset}"
    '')

    # --- HISTORY OS ---
    (pkgs.writeShellScriptBin "hist-os" ''
      nix profile history --profile /nix/var/nix/profiles/system
    '')

    # --- DEBUG OS ---
    (pkgs.writeShellScriptBin "debug-os" ''
      cd ${configDir} || exit
      git add .
      echo "🧪 Dry Run..."
      nixos-rebuild dry-build --flake . --show-trace --log-format internal-json -v |& ${pkgs.nix-output-monitor}/bin/nom --json
    '')

    # --- LOGS OS (New) ---
    (pkgs.writeShellScriptBin "logs-os" ''
      echo -e "${blue}🔍 System Error Logs (Last Boot)...${reset}"
      journalctl -p 3 -xb
    '')

    # --- REPAIR OS (New) ---
    (pkgs.writeShellScriptBin "repair-os" ''
      echo -e "${red}🔧 REPAIRING NIX STORE...${reset}"
      echo "This requires sudo and may take time."
      sudo nix-store --verify --check-contents --repair
    '')
  ];
}
