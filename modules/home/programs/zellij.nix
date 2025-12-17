{ pkgs, ... }:
{
  programs.zellij = {
    enable = true;
    enableZshIntegration = false;
  };

  # 1. Config
  xdg.configFile."zellij/config.kdl".text = ''
    theme "default"
    default_layout "default"
    ui {
       pane_frames {
           hide_session_name true
           rounded_corners true
       }
    }
    // Mouse support
    mouse_mode true
  '';

  # 2. Theme Template (Linked for Engine)
  xdg.configFile."theme-engine/templates/zellij.kdl".source = ../theme/templates/zellij.kdl;
}
