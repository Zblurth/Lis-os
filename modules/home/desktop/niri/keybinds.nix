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
      Mod+Space { spawn "rofi" "-show" "drun"; }
      Mod+Z { spawn "zeditor"; }
      Mod+Shift+W { spawn "wall-select"; }

      // === Deezer ===
      XF86AudioRaiseVolume allow-when-locked=true { spawn "playerctl" "--player=Deezer" "volume" "0.05+"; }
      XF86AudioLowerVolume allow-when-locked=true { spawn "playerctl" "--player=Deezer" "volume" "0.05-"; }
      XF86AudioMute        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "play-pause"; }

      XF86AudioPlay        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "play-pause"; }
      XF86AudioNext        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "next"; }
      XF86AudioPrev        allow-when-locked=true { spawn "playerctl" "--player=Deezer" "previous"; }
      Mod+WheelScrollDown cooldown-ms=50 { spawn "playerctl" "--player=Deezer" "volume" "0.05-"; }
      Mod+WheelScrollUp   cooldown-ms=50 { spawn "playerctl" "--player=Deezer" "volume" "0.05+"; }
      Mod+MouseMiddle     { spawn "playerctl" "--player=Deezer" "play-pause"; }

      // === Desktop Brightness (Native) ===
      // Works because Udev attached the driver automatically!
      Mod+F1 { spawn "swayosd-client" "--brightness" "lower"; }
      Mod+F2 { spawn "swayosd-client" "--brightness" "raise"; }

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

      ${hostKeybinds}
  }
''
