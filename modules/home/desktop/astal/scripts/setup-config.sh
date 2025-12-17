#!/usr/bin/env bash
set -e

CONFIG_SOURCE="$HOME/Lis-os/modules/home/desktop/astal/config.json"
OVERRIDE_TARGET="$HOME/.config/astal/lis-bar-override.json"

# Create config directory if missing
mkdir -p "$HOME/.config/astal"

# Remove old symlink if it exists
if [ -L "${OVERRIDE_TARGET}" ]; then
  rm "${OVERRIDE_TARGET}"
elif [ -f "${OVERRIDE_TARGET}" ]; then
  echo "Warning: ${OVERRIDE_TARGET} is a regular file, moving to backup"
  mv "${OVERRIDE_TARGET}" "${OVERRIDE_TARGET}.backup.$(date +%s)"
fi

# Create new symlink
ln -sf "${CONFIG_SOURCE}" "${OVERRIDE_TARGET}"
echo "Config symlink created: ${OVERRIDE_TARGET} -> ${CONFIG_SOURCE}"
echo "Edit $CONFIG_SOURCE and the changes will hot-reload in Astal"
