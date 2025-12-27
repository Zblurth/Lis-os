{ ... }:
''
  // --- Global Look ---
  window-rule {
      geometry-corner-radius 12
      clip-to-geometry true
      draw-border-with-background false
  }

  // --- Floating Tools (ERRANDS / Thunar) ---
  window-rule {
      match app-id="io.github.mrvladus.List"
      open-floating true
      default-column-width { proportion 0.4; }
      default-window-height { proportion 0.6; }
  }

  window-rule {
      match app-id="thunar" title="thunar-float"
      open-floating true
      default-column-width { proportion 0.6; }
      default-window-height { proportion 0.6; }
  }

  // --- Workspace 2: Web & General ---
  window-rule {
      match app-id=r#"^vivaldi.*$"#
      open-on-workspace "2"
      default-column-width { proportion 0.66; }
  }

  // --- Workspace 3: Music & Chat ---
  window-rule {
      match app-id="deezer-enhanced"
      open-on-workspace "3"
      default-column-width { proportion 0.33; }
  }

  window-rule {
      match app-id="vesktop"
      open-on-workspace "3"
      default-column-width { proportion 0.66; }
  }

  // --- App Defaults ---
  window-rule {
      match app-id=r#"^dev\.zed\.Zed$"#
      default-column-width { proportion 0.66; }
  }

  window-rule {
      match app-id="org.wezfurlong.wezterm"
      default-column-width { proportion 0.33; }
  }

  // --- Floating Terminal ---
  window-rule {
      match app-id="wezterm-float"
      open-floating true
      default-floating-position x=0.5 y=0.5
      default-column-width { proportion 0.5; }
      default-window-height { proportion 0.5; }
  }

  // --- Notifications (Steam uses custom windows, not XDG notifications) ---
  window-rule {
      match app-id="^steam$" title=r#"^notificationtoasts.*$"#
      open-floating true
      open-focused false
      default-floating-position x=16 y=16 relative-to="top-right"
  }

  window-rule {
      match app-id="^vivaldi.*$" title="^.*(Pop-up|Extension|Bitwarden).*$"
      open-floating true
      default-floating-position x=0.5 y=0.5 
  }
''
