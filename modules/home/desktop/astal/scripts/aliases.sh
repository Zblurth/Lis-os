#!/usr/bin/env bash

# Add these to your shell rc file:

# Reload astal config without rebuild
alias astal-reload='ln -sf ~/Lis-os/modules/home/desktop/astal/config.json ~/.config/astal/lis-bar-override.json && echo "Astal config reloaded"'

# Regenerate appearance and reload
alias theme-reload='~/Lis-os/modules/home/theme/libs/theme-engine ~/.cache/current_wallpaper.jpg && astal-reload'

# Restart ags (if needed)
alias ags-restart='pkill ags && ags &'
