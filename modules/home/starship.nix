{
  lib,
  ...
}:
let
  variables = import ../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
in
{
  programs.starship = {
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
        style = "bold blue";
      };
      character = {
        success_symbol = "[❯](bold green)";
        error_symbol = "[❯](bold red)";
        vimcmd_symbol = "[❮](cyan)";
      };
      nix_shell = {
        format = "[$symbol]($style) ";
        symbol = "🐚";
        style = "";
      };
      git_branch = {
        symbol = " ";
        style = "bold purple";
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
