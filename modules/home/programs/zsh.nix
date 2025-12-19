{
  pkgs,
  config,
  lib,
  ...
}:
let
  variables = import ../../../hosts/variables.nix;
in
{
  programs.zsh = {
    enable = true;
    enableCompletion = true;

    # 1. Autosuggestions (Ghost text from history)
    # Type 'gi' and it suggests 'git commit -m ...' -> Press Right Arrow to accept.
    autosuggestion.enable = true;

    # 2. Syntax Highlighting
    syntaxHighlighting.enable = true;

    # 3. History Settings
    history = {
      ignoreDups = true;
      save = 10000;
      size = 10000;
      path = "${config.xdg.dataHome}/zsh/history";
    };

    # 4. Plugins
    # We remove 'zsh-autocomplete' and add 'fzf-tab'
    plugins = [
      {
        name = "fzf-tab";
        src = pkgs.fetchFromGitHub {
          owner = "Aloxaf";
          repo = "fzf-tab";
          rev = "c2b4aa5ad2532cca91f23908ac7f00efb7ff09c9";
          # The correct hash for this revision
          sha256 = "sha256-gvZp8P3quOtcy1Xtt1LAW1cfZ/zCtnAmnWqcwrKel6w=";
        };
      }
    ];

    # 5. Initialization
    initContent = ''
      # --- FZF Tab Config (The Magic) ---
      # This replaces standard tab completion with fzf

      # Enable auto-correction for commands
      setopt CORRECT

      # Use the current theme colors for fzf
      export FZF_DEFAULT_OPTS=" \
        --color=bg+:#${config.lib.stylix.colors.base01 or "2e3440"},bg:#${
          config.lib.stylix.colors.base00 or "2e3440"
        },spinner:#${config.lib.stylix.colors.base06 or "8be9fd"},hl:#${
          config.lib.stylix.colors.base08 or "ff5555"
        } \
        --color=fg:#${config.lib.stylix.colors.base05 or "e5e9f0"},header:#${
          config.lib.stylix.colors.base08 or "ff5555"
        },info:#${config.lib.stylix.colors.base0E or "b48ead"},pointer:#${
          config.lib.stylix.colors.base06 or "8be9fd"
        } \
        --color=marker:#${config.lib.stylix.colors.base06 or "8be9fd"},fg+:#${
          config.lib.stylix.colors.base05 or "e5e9f0"
        },prompt:#${config.lib.stylix.colors.base0E or "b48ead"},hl+:#${
          config.lib.stylix.colors.base08 or "ff5555"
        }"

      # Disable fzf-tab for simple commands to speed things up
      zstyle ':completion:*' list-colors ''${(s.:.)LS_COLORS}
      zstyle ':fzf-tab:complete:cd:*' fzf-preview 'ls --color $realpath'
      zstyle ':fzf-tab:complete:__zoxide_z:*' fzf-preview 'ls --color $realpath'

      # Basic auto/tab complete behavior
      zstyle ':completion:*' matcher-list 'm:{a-z}={A-Za-z}'
      zstyle ':completion:*' list-colors "''${(s.:.)LS_COLORS}"
      zstyle ':completion:*' menu no
      zstyle ':fzf-tab:complete:*:*' fzf-preview 'less ''${(Q)realpath}'
      zstyle ':fzf-tab:complete:*:*' fzf-flags --height=40%

      # --- Keybindings ---
      bindkey -e # Emacs mode (standard)

      # Ctrl+Left/Right to jump words
      bindkey "^[[1;5C" forward-word
      bindkey "^[[1;5D" backward-word

      # History Search (Up Arrow)
      # This binds Up/Down to search history based on what you already typed
      autoload -U up-line-or-beginning-search
      autoload -U down-line-or-beginning-search
      zle -N up-line-or-beginning-search
      zle -N down-line-or-beginning-search
      bindkey "^[[A" up-line-or-beginning-search
      bindkey "^[[B" down-line-or-beginning-search

      # --- Integration ---
      eval "$(zoxide init zsh)"
      eval "$(starship init zsh)"
    '';

    shellAliases = {
      c = "clear";
      man = "batman";

      # Modern Core Utils
      ls = "eza --icons";
      ll = "eza -l --icons --group-directories-first";
      la = "eza -la --icons --group-directories-first";
      cat = "bat";
      grep = "rg";
      find = "fd";

      # Apps
      ze = "zeditor";
      # Quick Access
      rebuild = "sudo nixos-rebuild switch --flake ~/Lis-os";
      home = "home-manager switch --flake ~/Lis-os";
      Lis = "cd ~/Lis-os";
      lis = "cd ~/Lis-os";
      ast = "(cd ~/Lis-os/modules/home/desktop/astal && git add . && nix build .#lis-bar && (pkill -f 'lis-bar/main.js' || true) && ~/Lis-os/modules/home/desktop/astal/result/bin/lis-bar &)";
    };
  };
}
