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
      Mod+Space { spawn "noctalia-shell" "ipc" "call" "launcher" "toggle"; }

      // === System ===
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

      // === Navigation ===
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

      // === Mouse ===
      Mod+WheelScrollDown cooldown-ms=150 { focus-workspace-down; }
      Mod+WheelScrollUp   cooldown-ms=150 { focus-workspace-up; }

      ${hostKeybinds}
  }
''
