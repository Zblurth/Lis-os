{ ... }:
''
  // --- Global Look ---
  window-rule {
      geometry-corner-radius 12
      clip-to-geometry true
      draw-border-with-background false
  }



  // --- ERRANDS (Floating & Centered) ---
  window-rule {
      match app-id="io.github.mrvladus.List"
      open-floating true
      default-column-width { proportion 0.4; }
      default-window-height { proportion 0.6; }
  }

  // --- Floating Thunar ---
  window-rule {
      match app-id="thunar" title="thunar-float"
      open-floating true
      default-column-width { proportion 0.6; }
      default-window-height { proportion 0.6; }
  }

  // --- Workspace 1 Rules (Browser) ---
  window-rule {
      match at-startup=true app-id=r#"^vivaldi.*$"#
      open-on-workspace "2"
      default-column-width { proportion 0.66667; }
  }

  // --- ZED EDITOR ---
  window-rule {
      match app-id=r#"^dev\.zed\.Zed$"#
      default-column-width { proportion 0.33333; }
  }

  // --- Workspace 2 Rules (Music/Chat) ---
  window-rule {
      match app-id="deezer-enhanced"
      open-on-workspace "3"
      default-column-width { proportion 0.33333; }
  }

  window-rule {
      match app-id="vesktop"
      open-on-workspace "3"
      default-column-width { proportion 0.66667; }
  }

  // --- Terminal Rules ---
  window-rule {
      match app-id="org.wezfurlong.wezterm"
      default-column-width { proportion 0.33333; }
  }

  window-rule {
      match app-id="wezterm-float"
      open-floating true
      default-floating-position x=0.5 y=0.5
      default-column-width { proportion 0.5; }
      default-window-height { proportion 0.5; }
  }

  // --- Notifications (Steam/Vivaldi) ---
  window-rule {
      match app-id="^steam$" title="^Notification.*$"
      open-floating true
      default-floating-position x=1.0 y=0.0 
      // relative-to="monitor-work-area" // Removed to be safe, defaults should be fine or check docs for "top-right"
  }

  window-rule {
      match app-id="^vivaldi.*$" title="^.*(Pop-up|Extension|Bitwarden).*$"
      open-floating true
      default-floating-position x=0.5 y=0.5 
  }
''
