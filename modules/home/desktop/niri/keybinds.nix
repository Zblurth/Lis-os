{
  terminal,
  browser,
  hostKeybinds ? "",
  ...
}:
''
  binds {
      // === Apps ===
      Mod+Return { spawn "${terminal}"; }
      Mod+B { spawn "${browser}"; }
      Mod+E { spawn "errands"; }
      Mod+Z { spawn "zeditor"; }

      Mod+Space { spawn "launcher"; }
      Ctrl+Q { spawn "launcher" "windows"; }
      Mod+Shift+W { spawn "wall-select"; }

      // === File Manager ===
      Mod+T { spawn "thunar"; }
      // Floating Thunar (Requires window rule)
      Mod+Shift+T { spawn "thunar" "--name" "thunar-float"; }

      // === System & Window Management ===
      Mod+S { screenshot; }
      Mod+Q { close-window; }
      Mod+Shift+Q { quit; }
      Mod+L { spawn "loginctl" "lock-session"; }

      Mod+Minus { set-column-width "33.333%"; }
      Mod+Equal { set-column-width "50%"; }
      Mod+BracketLeft { set-column-width "66.667%"; }
      Mod+BracketRight { set-column-width "100%"; }
      Mod+R { switch-preset-column-width; }

      // Mod+F is now Maximize Column (User Choice)
      Mod+F { maximize-column; }
      Mod+Shift+F { fullscreen-window; }
      Mod+C { center-column; }

      Mod+Left  { focus-column-left; }
      Mod+Right { focus-column-right; }
      Mod+Shift+Left  { move-column-left; }
      Mod+Shift+Right { move-column-right; }
      Mod+Down  { focus-workspace-down; }
      Mod+Up    { focus-workspace-up; }
      Mod+Shift+Down  { move-column-to-workspace-down; }
      Mod+Shift+Up    { move-column-to-workspace-up; }

      Mod+J     { focus-window-down; }
      Mod+K     { focus-window-up; }

      // === Audio (Deezer) ===
      XF86AudioRaiseVolume allow-when-locked=true { spawn "playerctl" "--player=Deezer" "volume" "0.05+"; }
      XF86AudioLowerVolume allow-when-locked=true { spawn "playerctl" "--player=Deezer" "volume" "0.05-"; }
      XF86AudioMute        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "play-pause"; }
      XF86AudioPlay        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "play-pause"; }
      XF86AudioNext        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "next"; }
      XF86AudioPrev        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "previous"; }

      // === Brightness (SwayOSD) ===
      // Standard Keys
      XF86MonBrightnessUp   { spawn "swayosd-client" "--brightness" "raise"; }
      XF86MonBrightnessDown { spawn "swayosd-client" "--brightness" "lower"; }
      // Desktop Fallback
      Mod+F1 { spawn "swayosd-client" "--brightness" "lower"; }
      Mod+F2 { spawn "swayosd-client" "--brightness" "raise"; }

      ${hostKeybinds}
  }
''
