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
      Mod+Shift+Return { spawn "${terminal}" "start" "--class" "wezterm-float"; }
      Mod+B { spawn "${browser}"; }
      Mod+E { spawn "errands"; }
      Mod+Z { spawn "zeditor"; }

      Mod+Space { spawn "noctalia-shell" "ipc" "call" "launcher" "toggle"; }
      Mod+V { spawn "noctalia-shell" "ipc" "call" "launcher" "clipboard"; }
      Mod+Shift+W { spawn "noctalia-shell" "ipc" "call" "wallpaper" "toggle"; }
      
      // IDE Layout (Antigravity + WezTerm on WS1)
      Mod+Shift+1 { spawn "bash" "-c" "niri msg action focus-workspace 1; (cd ~/Lis-os && antigravity &); sleep 1; niri msg action set-column-width '66.667%'; sleep 0.2; wezterm start --always-new-process --cwd ~/Lis-os &"; }

      // === File Manager ===
      Mod+T { spawn "thunar"; }
      // Floating Thunar (Requires window rule)
      Mod+Shift+T { spawn "thunar" "--name" "thunar-float"; }

      // === System & Window Management ===
      Mod+S { screenshot; }
      Mod+Shift+Q { spawn "noctalia-shell" "ipc" "call" "sessionMenu" "toggle"; }
      Mod+Ctrl+Shift+S { spawn "noctalia-shell" "ipc" "call" "settings" "toggle"; }
      Mod+Q { close-window; }
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
