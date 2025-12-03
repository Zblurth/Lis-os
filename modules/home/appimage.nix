{ pkgs, ... }:

{
  home.packages = [
    # Example: Envision AppImage wrapper
    (pkgs.writeShellScriptBin "envision" ''
      # Download or use local AppImage
      ENVISION_CACHE="$HOME/.cache/appimages/envision.AppImage"

      # Create cache dir
      mkdir -p "$(dirname "$ENVISION_CACHE")"

      # Download if missing or old (>7 days)
      if [ ! -f "$ENVISION_CACHE" ] || [ $(find "$ENVISION_CACHE" -mtime +7) ]; then
        echo "📦 Downloading Envision AppImage..."
        curl -L "https://gitlab.com/gabmus/envision/-/releases/permalink/latest/downloads/envision.AppImage" \
          -o "$ENVISION_CACHE"
        chmod +x "$ENVISION_CACHE"
      fi

      # Run with appimage-run
      exec ${pkgs.appimage-run}/bin/appimage-run "$ENVISION_CACHE" "$@"
    '')
  ];
}
