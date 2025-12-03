{ ... }:
''
  // --- Global Look ---
  window-rule {
      geometry-corner-radius 12
      clip-to-geometry true
      draw-border-with-background false
  }

  // --- ZED EDITOR (33% Width) ---
  window-rule {
      match app-id=r#"^dev\.zed\.Zed$"#
      default-column-width { proportion 0.33; }
  }

  // --- ERRANDS (Floating & Centered) ---
  window-rule {
      match app-id=r#"^errands$|^io\.github\.mrvladus\.List$"#
      open-floating true
      default-column-width { proportion 0.4; }
      default-window-height { proportion 0.6; }
  }

  // --- Workspace 1 Rules ---
    window-rule {
        match at-startup=true app-id=r#"^vivaldi.*$"#
        open-on-workspace "1"
        default-column-width { proportion 0.66; }
    }

    // --- Workspace 2 Rules ---
    // Deezer (Left side intent)
    window-rule {
        match at-startup=true app-id="deezer-enhanced"
        open-on-workspace "2"
        default-column-width { proportion 0.33333; }
    }
    // Vesktop (Right side intent)
    window-rule {
        match at-startup=true app-id="vesktop"
        open-on-workspace "2"
        default-column-width { proportion 0.66667; }
    }
''
