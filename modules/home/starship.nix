# starship is a minimal, fast, and extremely customizable prompt for any shell!
{
  config,
  lib,
  ...
}:
let
  accent = "#${config.lib.stylix.colors.base0D}";
  # Import variables to check shell choice
  variables = import ../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
in
{
  programs.starship = {
    # Disable starship for Fish (it has its own custom prompt)
    enable = defaultShell != "fish";
    settings = {
      add_newline = false;
      format = lib.concatStrings [
        "$nix_shell"
        "$hostname"
        "$directory"
        "$git_branch"
        "$git_state"
        "$git_status"
        "\n"
        "$character"
      ];
      directory = {
        style = accent;
      };

      character = {
        success_symbol = "[❯](${accent})";
        error_symbol = "[❯](red)";
        vimcmd_symbol = "[❮](cyan)";
      };

      nix_shell = {
        format = "[$symbol]($style) ";
        symbol = "🐚";
        style = "";
      };

      git_branch = {
        symbol = " ";
        # If on main: Blue/Green.
        # If on ANY other branch: RED BACKGROUND (Danger Mode)
        style = "bg:red fg:white bold";
        format = "on [$symbol$branch]($style) ";
      };

      git_status = {
        format = "[[(*$conflicted$untracked$modified$staged$renamed$deleted)](218)($ahead_behind$stashed)]($style)";
        style = "cyan";
        conflicted = "";
        renamed = "";
        deleted = "";
        stashed = "≡";
      };

      git_state = {
        format = "([$state( $progress_current/$progress_total)]($style)) ";
        style = "bright-black";
      };
    };
  };
}
