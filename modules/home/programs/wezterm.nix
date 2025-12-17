{ pkgs, ... }:
{
  programs.wezterm = {
    enable = true;
    extraConfig = ''
      local wezterm = require 'wezterm'
      local config = wezterm.config_builder()

      -- 1. Appearance (Kitty Parity)
      config.font = wezterm.font 'JetBrains Mono'
      config.font_size = 12.0
      config.window_padding = {
        left = 4,
        right = 4,
        top = 4,
        bottom = 4,
      }
      config.window_background_opacity = 0.95 
      config.enable_tab_bar = true
      config.use_fancy_tab_bar = false
      config.tab_bar_at_bottom = true
      config.window_close_confirmation = 'NeverPrompt'       

      -- 2. Dynamic Theming (Engine Integration)
      local colors_path = wezterm.home_dir .. "/.cache/wal/colors-wezterm.lua"
      wezterm.add_to_config_reload_watch_list(colors_path)
      local f = io.open(colors_path, "r")
      if f then
        f:close()
        -- Load the table returned by the lua file
        local scheme = dofile(colors_path)
        config.colors = scheme
      else
        -- Fallback if engine hasn't run yet
        config.color_scheme = 'Catppuccin Mocha'
      end

      -- 3. Mouse & Interaction
      config.hide_mouse_cursor_when_typing = true

      -- 4. Status Bar Helper (The "Control Helper")
      wezterm.on('update-right-status', function(window, pane)
        window:set_right_status(wezterm.format({
          { Attribute = { Intensity = 'Bold' } },
          { Text = '  CTRL+T: New Tab | CTRL+W: Close | CTRL+TAB: Cycle  ' },
        }))
      end)

      -- 5. Keybinds & Mouse Maps
      config.keys = {
        -- Font Sizing
        { key = 'Equal', mods = 'CTRL|SHIFT', action = wezterm.action.IncreaseFontSize },
        { key = 'Minus', mods = 'CTRL|SHIFT', action = wezterm.action.DecreaseFontSize },
        { key = '0', mods = 'CTRL|SHIFT', action = wezterm.action.ResetFontSize },
        
        -- Standard Copy/Paste (Modern Style)
        { key = 'c', mods = 'CTRL', action = wezterm.action.CopyTo 'Clipboard' },
        { key = 'v', mods = 'CTRL', action = wezterm.action.PasteFrom 'Clipboard' },
        
        -- Tabs (Browser Style)
        { key = 't', mods = 'CTRL', action = wezterm.action.SpawnTab 'CurrentPaneDomain' },
        { key = 'w', mods = 'CTRL', action = wezterm.action.CloseCurrentTab { confirm = false } },
        { key = 'Tab', mods = 'CTRL', action = wezterm.action.ActivateTabRelative(1) },
        { key = 'Tab', mods = 'CTRL|SHIFT', action = wezterm.action.ActivateTabRelative(-1) },

        -- Stop Process (Remapped)
        { key = 'C', mods = 'CTRL|SHIFT', action = wezterm.action.SendKey { key = 'c', mods = 'CTRL' } },
      }

      config.mouse_bindings = {
        -- Custom Right Click Menu
        {
          event = { Up = { streak = 1, button = 'Right' } },
          mods = 'NONE',
          action = wezterm.action.InputSelector {
            title = 'Context Menu',
            choices = {
              { label = '📄 Copy', id = 'copy' },
              { label = '📋 Paste', id = 'paste' },
              { label = '➕ New Tab', id = 'new_tab' },
              { label = '✖ Close Tab', id = 'close_tab' },
              { label = '➖ Split Vertical', id = 'vsplit' },
              { label = '◔ Split Horizontal', id = 'hsplit' },
              { label = '🧹 Clear Screen', id = 'clear' },
              { label = '🛑 Stop Process (Ctrl+C)', id = 'stop' },
            },
            action = wezterm.action_callback(function(window, pane, id, label)
              if not id and not label then
                wezterm.log_info 'Menu cancelled'
              else
                if id == 'copy' then window:perform_action(wezterm.action.CopyTo 'Clipboard', pane) end
                if id == 'paste' then window:perform_action(wezterm.action.PasteFrom 'Clipboard', pane) end
                
                -- Tabs
                if id == 'new_tab' then window:perform_action(wezterm.action.SpawnTab 'CurrentPaneDomain', pane) end
                if id == 'close_tab' then window:perform_action(wezterm.action.CloseCurrentTab { confirm = false }, pane) end

                -- Splits
                if id == 'vsplit' then window:perform_action(wezterm.action.SplitVertical { domain = 'CurrentPaneDomain' }, pane) end
                if id == 'hsplit' then window:perform_action(wezterm.action.SplitHorizontal { domain = 'CurrentPaneDomain' }, pane) end
                if id == 'close' then window:perform_action(wezterm.action.CloseCurrentPane { confirm = false }, pane) end

                -- ZSH / Term control
                if id == 'clear' then pane:send_text('\x0c') end -- Ctrl+L
                if id == 'stop' then pane:send_text('\x03') end  -- Ctrl+C
              end
            end),
          },
        },
        -- Ctrl+Click Open Link
        {
          event = { Up = { streak = 1, button = 'Left' } },
          mods = 'CTRL',
          action = wezterm.action.OpenLinkAtMouseCursor,
        },
      }

      return config
    '';
  };
}
