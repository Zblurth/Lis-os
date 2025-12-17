{ pkgs, ... }:
let
  variables = import ../../../hosts/variables.nix;
  defaultShell = variables.defaultShell or "zsh";
  shellPackage = if defaultShell == "fish" then pkgs.fish else pkgs.zsh;
in
{
  programs.kitty = {
    enable = true;

    settings = {
      shell = "${shellPackage}/bin/${defaultShell}";

      # --- Appearance ---
      font_size = 12;
      font_family = "JetBrains Mono";
      window_padding_width = 4;
      cursor_trail = 1;

      # --- Theming Integration ---
      allow_remote_control = "yes";
      listen_on = "unix:@mykitty";
      include = "~/.cache/wal/colors-kitty.conf"; # Dynamic colors include

      # --- Mouse & Interaction ---
      # 'no' means middle click won't paste immediately (prevents accidents)
      paste_on_middle_click = "no";
      copy_on_select = "clipboard";

      # Hide mouse when typing (cleaner)
      mouse_hide_wait = "3.0";

      # Open links with ctrl+click
      open_url_with = "default";
      url_style = "curly";

      # --- Shell Integration ---
      # This allows features like jumping to the previous prompt with clicks
      shell_integration = "enabled";
    };

    # Keybinds and Mouse Maps
    extraConfig = ''
      # --- Mouse Actions ---
      # Ctrl+Click to open URL is default, but let's force good behavior:
      mouse_map left click ungrabbed mouse_handle_click selection link prompt

      # Right click for context menu
      # mouse_map right press ungrabbed mouse_show_command_output

      # Scroll with Wheel
      map shift+up        scroll_line_up
      map shift+down      scroll_line_down
      map ctrl+shift+up   scroll_page_up
      map ctrl+shift+down scroll_page_down

      # Font Sizing (Ctrl+Shift+Equal/Minus is standard, but Wheel works too)
      map ctrl+shift+equal change_font_size all +2.0
      map ctrl+shift+minus change_font_size all -2.0
      map ctrl+mousewheel_up change_font_size all +1.0
      map ctrl+mousewheel_down change_font_size all -1.0

      # --- Tab Management ---
      map ctrl+shift+t new_tab
      map ctrl+shift+w close_tab
      map ctrl+shift+right next_tab
      map ctrl+shift+left previous_tab
    '';
  };

  # IMPORTANT: Use the new Theme Engine location we defined earlier!
  xdg.configFile."theme-engine/templates/kitty.conf".source = ../theme/templates/kitty.conf;
}
