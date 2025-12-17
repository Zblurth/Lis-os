{ ... }:
''
  config-notification {
      disable-failed
  }
  gestures {
      hot-corners {
          off
      }
  }
  input {
      keyboard {
          xkb {
              layout "us"
              variant ""
          }
          numlock
      }
      touchpad {
          natural-scroll
      }
      mouse {
          accel-profile "adaptive"
          accel-speed 1.0
      }
      trackpoint {
      }

      focus-follows-mouse
      warp-mouse-to-focus
  }

  cursor {
      hide-when-typing
  }

  layout {
      gaps 9
      center-focused-column "never"
      always-center-single-column
      preset-column-widths {
          proportion 0.33333
          proportion 0.5
          proportion 0.66667
          proportion 1.0
      }
      default-column-width { proportion 0.5; }
      border {
          width 2
          active-color "#cba6f7"
          inactive-color "#45475a"
          urgent-color "#f5c2e7"
      }
      focus-ring {
          off
          width 2
          active-color   "#808080"
          inactive-color "#505050"
      }
      shadow {
          softness 30
          spread 5
          offset x=0 y=5
          color "#0007"
      }
      struts {
      }
  }
  /-layer-rule {
      match namespace="^quickshell$"
      place-within-backdrop true
  }
  overview {
      backdrop-color "#1e1e2e"
      workspace-shadow {
          softness 40
          spread 10
          offset x=0 y=10
          color "#00000050"
      }
      zoom 0.5
  }
  animations {
      workspace-switch {
          spring damping-ratio=0.80 stiffness=523 epsilon=0.0001
      }
      window-open {
          duration-ms 150
          curve "ease-out-expo"
      }
      window-close {
          duration-ms 150
          curve "ease-out-quad"
      }
      horizontal-view-movement {
          spring damping-ratio=0.85 stiffness=423 epsilon=0.0001
      }
      window-movement {
          spring damping-ratio=0.75 stiffness=323 epsilon=0.0001
      }
      window-resize {
          spring damping-ratio=0.85 stiffness=423 epsilon=0.0001
      }
      config-notification-open-close {
          spring damping-ratio=0.65 stiffness=923 epsilon=0.001
      }
      screenshot-ui-open {
          duration-ms 200
          curve "ease-out-quad"
      }
      overview-open-close {
          spring damping-ratio=0.85 stiffness=800 epsilon=0.0001
      }
  }
''
