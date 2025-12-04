{ ... }:
''
  // --- Global Look ---
  window-rule {
      geometry-corner-radius 12
      clip-to-geometry true
      draw-border-with-background false
  }

  // --- Rofi Specific Rule (Shadows & Floating) ---
  window-rule {
      match app-id="^rofi$"
      open-floating true
      shadow {
          on
          softness 30
          spread 10
          color "#00000080"
      }
  }

  // --- ERRANDS (Floating & Centered) ---
  window-rule {
      match app-id=r#"^errands$|^io\.github\\.mrvladus\\.List$"#
      open-floating true
      default-column-width { proportion 0.4; }
      default-window-height { proportion 0.6; }
  }

  // --- Workspace 1 Rules (Browser) ---
  window-rule {
      match at-startup=true app-id=r#"^vivaldi.*$"#
      open-on-workspace "1"
      default-column-width { proportion 0.66667; }
  }

  // --- ZED EDITOR ---
  window-rule {
      match app-id=r#"^dev\\.zed\\.Zed$"#
      default-column-width { proportion 0.33333; }
  }

  // --- Workspace 2 Rules (Music/Chat) ---
  window-rule {
      match at-startup=true app-id="deezer-enhanced"
      open-on-workspace "2"
      default-column-width { proportion 0.33333; }
  }

  window-rule {
      match at-startup=true app-id="vesktop"
      open-on-workspace "2"
      default-column-width { proportion 0.66667; }
  }
''
