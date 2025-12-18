{
  pkgs,
  lib,
  inputs,
  ...
}:

let
  system = pkgs.stdenv.hostPlatform.system;
  # Safely get the base package, defaulting to 'default' if noctalia-shell invalid
  basePkg =
    inputs.noctalia.packages.${system}.noctalia-shell or inputs.noctalia.packages.${system}.default;

  patchedNoctalia = basePkg.overrideAttrs (old: {
    # Debloat: Remove Matugen from runtime dependencies
    buildInputs = lib.lists.remove pkgs.matugen (old.buildInputs or [ ]);

    postPatch = (old.postPatch or "") + ''
      echo "Applying Soft-Fork Patches..."

      # ----------------------------------------------------------------
      # HOOK: Replace Matugen with Lis-OS Theme Engine + DEBUG
      # ----------------------------------------------------------------
      substituteInPlace Services/Theming/AppThemeService.qml \
        --replace-fail 'TemplateProcessor.processWallpaperColors(wp, mode);' \
                       'var clean = wp.toString().replace("file://", ""); Quickshell.execDetached(["bash", "-c", "theme-engine " + clean + " > /tmp/theme-hook.log 2>&1"]);'

      substituteInPlace shell.qml \
        --replace-fail 'GitHubService.init();' '// GitHubService.init();' \
        --replace-fail 'UpdateService.init();' '// UpdateService.init();'

      # ----------------------------------------------------------------
      # DEBLOAT: Remove Upstream Services (Skipping for now to unblock build)
      # ----------------------------------------------------------------
      # substituteInPlace shell.qml ...
        
      echo "Soft-Fork Patches Applied Successfully."
    '';
  });
in
{
  # Install the patched package directly
  home.packages = [ patchedNoctalia ];
}
