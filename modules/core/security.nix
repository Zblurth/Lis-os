_: {
  security = {
    rtkit.enable = true;

    # PAM settings (existing)
    pam.services.swaylock = {
      text = ''auth include login '';
    };

    polkit = {
      enable = true;
      extraConfig = ''
        /* Allow normal users to reboot/shutdown */
        polkit.addRule(function(action, subject) {
          if ( subject.isInGroup("users") && (
           action.id == "org.freedesktop.login1.reboot" ||
           action.id == "org.freedesktop.login1.reboot-multiple-sessions" ||
           action.id == "org.freedesktop.login1.power-off" ||
           action.id == "org.freedesktop.login1.power-off-multiple-sessions"
          ))
          { return polkit.Result.YES; }
        });

        /* FIX: Allow CoreCtrl to apply settings without password */
        polkit.addRule(function(action, subject) {
            if ((action.id == "org.corectrl.helper.init" ||
                 action.id == "org.corectrl.helper1.init") &&
                subject.isInGroup("wheel")) {
                return polkit.Result.YES;
            }
        });
      '';
    };
  };
}
