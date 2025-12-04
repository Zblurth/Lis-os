{ ... }:
''
  // Declare named workspaces so they exist at startup
  // This allows open-on-workspace rules to work reliably

  workspace "1" {
      // You can pin this to a monitor if you have multiple
      // open-on-output "DP-1"
  }

  workspace "2" {
      // open-on-output "DP-1"
  }
''
