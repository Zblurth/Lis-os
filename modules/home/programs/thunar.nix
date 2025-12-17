{ ... }:
{
  # This enables thunar in home-manager
  xfconf.enable = true;  # Thunar needs xfconf for settings
  gtk.enable = true;     # Thunar is GTK app

  # Store thunar settings via xfconf
  xdg.configFile."xfce4/xfconf/xfce-perchannel-xml/thunar.xml".text = ''
    <?xml version="1.0" encoding="UTF-8"?>
    <channel name="thunar" version="1.0">
      <property name="last-view" type="string" value="ThunarDetailsView"/>
      <property name="last-icon-view-zoom-level" type="string" value="THUNAR_ZOOM_LEVEL_NORMAL"/>
      <property name="last-details-view-zoom-level" type="string" value="THUNAR_ZOOM_LEVEL_NORMAL"/>
      <property name="last-window-width" type="int" value="1024"/>
      <property name="last-window-height" type="int" value="768"/>
      <property name="misc-single-click" type="bool" value="false"/>
      <property name="misc-new-tab-as-current" type="bool" value="true"/>
    </channel>
  '';

  # Custom actions (right-click menu)
  xdg.configFile."Thunar/uca.xml".text = ''
    <?xml version="1.0" encoding="UTF-8"?>
    <actions>
      <action>
        <icon>utilities-terminal</icon>
        <name>Open Terminal Here</name>
        <command>kitty --working-directory=%f</command>
        <description>Open terminal in this folder</description>
        <patterns>*</patterns>
        <directories/>
      </action>
    </actions>
  '';
}
