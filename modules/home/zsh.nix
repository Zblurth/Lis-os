{
  pkgs,
  host,
  ...
}:
let
  variables = import ../../hosts/${host}/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
in
{
  programs.zsh = {
    enable = true;
    autosuggestion.enable = true;
    syntaxHighlighting = {
      enable = true;
      highlighters = [
        "main"
        "brackets"
        "pattern"
        "regexp"
        "root"
        "line"
      ];
    };
    historySubstringSearch.enable = true;

    history = {
      ignoreDups = true;
      save = 10000;
      size = 10000;
    };

    oh-my-zsh = {
      enable = true;
    };

    plugins = [ ];

    initContent = ''
      # Auto-launch Fish if configured as default shell
      ${
        if defaultShell == "fish" then
          ''
            if [[ $(ps --no-header --pid=$PPID --format=comm) != "fish" && -z ''${BASH_EXECUTION_STRING} ]]; then
              shopt -q login_shell && LOGIN_OPTION='--login' || LOGIN_OPTION=""
              exec fish $LOGIN_OPTION
            fi
          ''
        else
          ""
      }

      bindkey "\eh" backward-word
      bindkey "\ej" down-line-or-history
      bindkey "\ek" up-line-or-history
      bindkey "\el" forward-word
      if [ -f $HOME/.zshrc-personal ]; then
        source $HOME/.zshrc-personal
      fi

      # Launch fastfetch on first terminal spawn
      if [[ -z "$FASTFETCH_LAUNCHED" ]]; then
        export FASTFETCH_LAUNCHED=1
        fastfetch
      fi
    '';

    shellAliases = {
      c = "clear";
      fr = "fr"; # Changed to rely on your script
      fu = "up-os"; # Changed to rely on your script
      rebuild = "fr";
      update = "up-os";
      cleanup = "clean-os";
      # ncg alias is redundant with clean-os
      man = "batman";
      # hosts/switch aliases are for tools you removed, can delete if unused
    };
  };
}
