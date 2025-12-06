{ pkgs, ... }:
{
  home.packages = [
    (pkgs.writeScriptBin "nix-inspect" ''
      #!${pkgs.python3.withPackages (p: [ p.rich ])}/bin/python3
      import os
      import re
      import sys
      import json
      import subprocess
      from rich.console import Console
      from rich.tree import Tree
      from rich.panel import Panel
      from rich.table import Table
      from rich.text import Text

      # --- Configuration ---
      ROOT_DIR = os.path.expanduser("~/Lis-os")
      console = Console()

      # ... (Existing parsing logic) ...
      def strip_comments(text):
          text = re.sub(r'/\*.*?\*/', "", text, flags=re.DOTALL)
          text = re.sub(r'//.*', "", text)
          lines = text.split("\n")
          clean_lines = []
          for line in lines:
              if re.search(r'^\s*#', line): continue
              if " #" in line: line = line.split(" #")[0]
              clean_lines.append(line)
          return "\n".join(clean_lines)

      def parse_file(filepath):
          imports = []
          configs = []
          if not os.path.exists(filepath) or os.path.isdir(filepath): return [], []
          with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
              raw_content = f.read()
          content = strip_comments(raw_content)

          # 1. Standard Imports
          import_blocks = re.findall(r'imports\s*=\s*\[(.*?)\];', content, re.DOTALL)
          for block in import_blocks:
              paths = block.split()
              for p in paths:
                  p = p.strip()
                  if not p: continue
                  if p.startswith("./") or p.startswith("../") or "inputs." in p:
                      imports.append(p.rstrip(";"))

          # 2. Inline Imports (Improved Regex)
          # Matches: import ./foo or import ../foo
          inline_imports = re.findall(r'import\s+(\.?\./[a-zA-Z0-9_\-\./]+)', content)
          for p in inline_imports: imports.append(p.strip())

          # 3. Config Hints
          matches = re.findall(r'^\s*([a-zA-Z0-9\._]+)\s*=', content, re.MULTILINE)
          for m in matches:
              if m not in ["imports", "options", "config", "pkgs", "lib", "home.packages", "home.file"]:
                  configs.append(m)
          return imports, configs

      def resolve_path(base_file, import_path):
          if "inputs." in import_path: return "INPUT"
          base_dir = os.path.dirname(base_file)
          full_path = os.path.normpath(os.path.join(base_dir, import_path))
          if os.path.isdir(full_path):
              default_nix = os.path.join(full_path, "default.nix")
              if os.path.exists(default_nix): return default_nix
          return full_path

      def build_tree(filepath, tree_node, visited, all_imported_files):
          if filepath == "INPUT": return
          real_path = os.path.realpath(filepath)
          if real_path in visited:
              tree_node.add(f"[yellow]↻ Recursive: {os.path.basename(filepath)}[/]")
              return
          visited.add(real_path)
          all_imported_files.add(real_path)
          imports, configs = parse_file(filepath)
          if configs:
              conf_str = ", ".join(configs[:3])
              if len(configs) > 3: conf_str += "..."
              tree_node.add(f"[dim italic]Sets: {conf_str}[/]")
          for imp in imports:
              if "inputs." in imp: tree_node.add(f"[blue]📦 {imp}[/]")
              else:
                  full_path = resolve_path(filepath, imp)
                  filename = os.path.basename(full_path)
                  if not os.path.exists(full_path):
                       if os.path.isdir(full_path): sub_node = tree_node.add(f"[red]❌ {filename} (Folder missing default.nix)[/]")
                       else: sub_node = tree_node.add(f"[red]❌ {filename} (Missing)[/]")
                  else:
                       label = filename
                       if filename == "default.nix": label = f"{os.path.basename(os.path.dirname(full_path))}/default.nix"
                       sub_node = tree_node.add(f"[green]📄 {label}[/]")
                       build_tree(full_path, sub_node, visited, all_imported_files)

      def find_orphans(root_dir, all_imported_files):
          all_nix_files = set()
          for root, dirs, files in os.walk(root_dir):
              if ".git" in dirs: dirs.remove(".git")
              if "result" in dirs: dirs.remove("result")
              for file in files:
                  if file.endswith(".nix"):
                      all_nix_files.add(os.path.realpath(os.path.join(root, file)))
          return sorted(list(all_nix_files - all_imported_files))

      def format_size(bytes_val):
          for unit in ['B', 'KiB', 'MiB', 'GiB']:
              if bytes_val < 1024.0:
                  return f"{bytes_val:.1f} {unit}"
              bytes_val /= 1024.0
          return f"{bytes_val:.1f} TiB"

      def show_disk_usage():
          console.print(Panel("[bold cyan]💾 System Disk Usage (JSON Analysis)[/]", expand=False))
          console.print("[dim italic]Querying Nix store (this may take a few seconds)...[/]")

          try:
              # Get recursive info in JSON format (Safe & Robust)
              cmd = ["nix", "path-info", "-r", "-s", "-S", "--json", "/run/current-system"]
              result = subprocess.run(cmd, capture_output=True, text=True)

              if result.returncode != 0:
                  console.print(f"[red]Nix command failed:[/red] {result.stderr}")
                  return

              data = json.loads(result.stdout)

              # Process Data
              packages = []
              total_system_size = 0

              # Find the root /run/current-system to get total size
              for path, info in data.items():
                  if path.endswith("current-system"):
                      total_system_size = info["closureSize"]

                  name = os.path.basename(path)
                  # Remove hash (first 33 chars usually)
                  if len(name) > 33: name = name[33:]

                  packages.append({
                      "name": name,
                      "self": info["narSize"],      # Size of the package itself
                      "closure": info["closureSize"] # Size of package + dependencies
                  })

              console.print(f"[bold]Total System Weight:[/bold] [green]{format_size(total_system_size)}[/green]\n")

              # --- Table 1: FATTEST PACKAGES (Self Size) ---
              packages.sort(key=lambda x: x["self"], reverse=True)

              table_self = Table(title="Top 20 'Fat' Packages (Individual Size)", show_header=True, header_style="bold yellow")
              table_self.add_column("Package", style="white")
              table_self.add_column("Self Size", justify="right", style="yellow")
              table_self.add_column("Closure Size", justify="right", style="dim green")

              for p in packages[:20]:
                  table_self.add_row(
                      p["name"],
                      format_size(p["self"]),
                      format_size(p["closure"])
                  )
              console.print(table_self)
              console.print("")

              # --- Table 2: HEAVIEST FAMILIES (Closure Size) ---
              # Filter out small wrappers to reduce noise
              packages.sort(key=lambda x: x["closure"], reverse=True)

              table_closure = Table(title="Top 20 Heaviest Families (Total Dependencies)", show_header=True, header_style="bold magenta")
              table_closure.add_column("Package", style="white")
              table_closure.add_column("Self Size", justify="right", style="dim yellow")
              table_closure.add_column("Closure Size", justify="right", style="magenta")

              count = 0
              seen_sizes = set()

              for p in packages:
                  if count >= 20: break
                  # De-duplicate entries that are basically aliases (same closure size)
                  if p["closure"] in seen_sizes: continue
                  seen_sizes.add(p["closure"])

                  table_closure.add_row(
                      p["name"],
                      format_size(p["self"]),
                      format_size(p["closure"])
                  )
                  count += 1

              console.print(table_closure)

          except Exception as e:
              # Safe printing of errors
              console.print(Text(f"Error analysis failed: {str(e)}", style="red"))

      def main():
          if len(sys.argv) > 1 and sys.argv[1] == "--disk":
              show_disk_usage()
              return

          console.print(Panel.fit("[bold magenta]Lis-OS Config Inspector[/]", border_style="magenta"))

          visited = set()
          all_imported_files = set()
          hosts_entry = os.path.join(ROOT_DIR, "hosts/default.nix")
          flake_entry = os.path.join(ROOT_DIR, "flake.nix")

          if os.path.exists(hosts_entry): all_imported_files.add(os.path.realpath(hosts_entry))
          if os.path.exists(flake_entry): all_imported_files.add(os.path.realpath(flake_entry))

          root_tree = Tree(f"[bold blue]📂 {os.path.basename(ROOT_DIR)}[/]")
          if os.path.exists(hosts_entry):
              host_node = root_tree.add(f"[bold cyan]🚀 hosts/default.nix (System Root)[/]")
              build_tree(hosts_entry, host_node, visited, all_imported_files)
          else:
              root_tree.add("[bold red]❌ hosts/default.nix not found![/]")

          console.print(root_tree)
          console.print("")

          orphans = find_orphans(ROOT_DIR, all_imported_files)
          if orphans:
              console.print(Panel("[bold yellow]🏝️  FLOATING ISLANDS DETECTED (Orphans)[/]", expand=False))
              orphan_tree = Tree("[yellow]Orphans[/]")
              for orphan in orphans:
                  rel_path = os.path.relpath(orphan, ROOT_DIR)
                  orphan_tree.add(f"[red]{rel_path}[/]")
              console.print(orphan_tree)
          else:
              console.print("[bold green]✅ No orphans found![/]")

          console.print("\n[dim]Tip: Run 'nix-inspect --disk' to see storage usage.[/dim]")

      if __name__ == "__main__":
          main()
    '')
  ];
}
