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
      import time
      from rich.console import Console
      from rich.tree import Tree
      from rich.panel import Panel
      from rich.table import Table
      from rich.markdown import Markdown
      from rich.syntax import Syntax
      from rich.prompt import Prompt, Confirm

      # --- Configuration ---
      ROOT_DIR = os.path.expanduser("~/Lis-os")
      CONSOLE = Console()

      class Analyzer:
          def __init__(self, root):
              self.root = root
              self.files = {} # path -> content
              self.nix_files = []
              self.other_files = []
              self.scan_files()

          def scan_files(self):
              for root, _, files in os.walk(self.root):
                  if "result" in root or ".git" in root: continue
                  for f in files:
                      path = os.path.join(root, f)
                      if f.endswith(".nix"):
                          self.nix_files.append(path)
                          with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              self.files[path] = fd.read()
                      elif f.endswith((".css", ".js", ".ts", ".tsx", ".kdl", ".toml", ".yuck", ".xml")):
                           self.other_files.append(path)
                           with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              self.files[path] = fd.read()

          def parse_packages(self):
              """Extracts explicitly installed packages vs program configurations."""
              installed = {} # name -> [files_where_defined]
              configured = {} # name -> [files_where_enabled]

              # Improved Regex
              # 1. Standard: home.packages = [ ... ] or with pkgs; [ ... ]
              pkg_pattern = re.compile(r'home\.packages\s*=\s*(?:with\s+pkgs;\s*)?\[(.*?)\]', re.DOTALL)
              # 2. Variable Lists: myPackages = [ ... ]
              # This pattern is no longer used directly for package extraction, but kept for context if needed.
              # list_pattern = re.compile(r'\[(.*?)\]', re.DOTALL)
              
              # 3. Catch: programs.xyz = { ... }
              prog_pattern = re.compile(r'programs\.([a-zA-Z0-9_\-]+)\s*=\s*{')
              
              # 4. Catch: services.xyz = { ... }
              svc_pattern = re.compile(r'services\.([a-zA-Z0-9_\-]+)\s*=\s*{')

              # Keywords/Patterns to ignore in package lists (Shell scripts, arguments, variables)
              # Strict pattern for valid package names
              valid_package_name_pattern = re.compile(r'^[a-zA-Z0-9\-\._]+$')
              ignore_keywords = {
                  "pkgs", "with", "inherit", "let", "in", "mkIf", "lib", "callPackage", 
                  "writeShellScriptBin", "writeScriptBin", "stdenv", "buildInputs", "nativeBuildInputs",
                  "echo", "exit", "if", "then", "else", "fi", "for", "do", "done", "case", "esac",
                  "grep", "sed", "awk", "cat", "mkdir", "rm", "touch", "find", "true", "false",
                  "glib", "gapplication", "action", "toggle-window", "return", "wait"
              }

              for path in self.nix_files:
                  content = self.files[path]
                  rel_path = os.path.relpath(path, self.root)
                  
                  # Find Packages (Global search in lists)
                  # We try to be smart: if a list contains package-looking names, we grab them
                  for match in pkg_pattern.findall(content):
                      # 1. Remove comments
                      clean = re.sub(r'#.*', "", match)
                      
                      # 2. Remove strings (crucial for inline scripts)
                      # Remove '''...''' blocks
                      clean = re.sub(r"'''[\s\S]*?'''", "", clean)
                      # Remove "..." blocks
                      clean = re.sub(r'"[^"]*"', "", clean)
                      
                      for t in clean.split():
                          t = t.strip()
                          # 1. Length check
                          if len(t) < 2: continue
                          # 2. Strict character check (only allow valid package chars)
                          if not valid_package_name_pattern.fullmatch(t): continue
                          # 3. Keyword check
                          if t in ignore_keywords: continue
                          # 4. Path check (already covered by valid_package_name_pattern, but explicit for clarity)
                          if "/" in t: continue
                          # 5. Parens check (sometimes split leaves them from function calls)
                          if "(" in t or ")" in t: continue
                          
                          if t not in installed: installed[t] = []
                          installed[t].append(rel_path)

                  # Find Programs
                  for match in prog_pattern.findall(content):
                      if match not in configured: configured[match] = []
                      configured[match].append(rel_path)

                  # Find Services
                  for match in svc_pattern.findall(content):
                      if match not in configured: configured[match] = []
                      configured[match].append(rel_path)

              return installed, configured

          def analyze_duplication(self):
              installed, configured = self.parse_packages()
              redundant = []
              implicit = []
              ghosts = []

              # Load packages.nix content for "Mental Map" check
              packages_nix_content = ""
              for p, c in self.files.items():
                  if p.endswith("modules/home/packages.nix"):
                      packages_nix_content = c
                      break
              
              # Check Configured Programs
              for prog, config_files in configured.items():
                  if prog in installed:
                      redundant.append({
                          "name": prog,
                          "installed_in": installed[prog],
                          "configured_in": config_files
                      })
                  else:
                      # If NOT in installed list, check if it's in packages.nix text (Mental Map)
                      # We do a simple substring check, including comments, to see if it's "mentally mapped"
                      if prog in packages_nix_content:
                          implicit.append({
                             "name": prog,
                             "file": config_files[0]
                          })
                      else:
                          # If NOT in installed list AND NOT in packages.nix text -> GHOST
                          ghosts.append({
                              "name": prog,
                              "file": config_files[0]
                          })

              return redundant, implicit, ghosts, installed, configured

      class Dashboard:
          def __init__(self):
              self.analyzer = Analyzer(ROOT_DIR)

          def clear(self):
              CONSOLE.clear()
              CONSOLE.print(Panel.fit("[bold magenta]Lis-OS Command Center[/]", border_style="magenta"))

          def show_tree(self):
              """Full Nix Dependency Tree"""
              visited = set()
              
              def add_node(path, node):
                  path = os.path.realpath(path)
                  if path in visited: return
                  visited.add(path)
                  
                  if path not in self.analyzer.files: return
                  # SKIP parsing for the inspector itself to avoid meta-confusion
                  if os.path.basename(path) == "nix-inspect.nix": return
                  
                  content = self.analyzer.files[path]
                  
                  imports = re.findall(r'(\./[\w\-\./]+|\.\./[\w\-\./]+)', content)
                  
                  for imp in imports:
                      base_dir = os.path.dirname(path)
                      full_path = os.path.normpath(os.path.join(base_dir, imp))
                      
                      is_dir_import = False
                      if os.path.isdir(full_path): 
                          is_dir_import = True
                          full_path = os.path.join(full_path, "default.nix")
                      
                      if os.path.exists(full_path):
                          filename = os.path.basename(full_path)
                          if filename == "default.nix":
                              parent = os.path.basename(os.path.dirname(full_path))
                              label = f"{parent}/default.nix"
                          else:
                              label = filename   
                          sub = node.add(f"[green]{label}[/]")
                          add_node(full_path, sub)
                      else:
                          # Handle Dynamic Directories gracefully
                          # If it was a directory import BUT default.nix was missing, 
                          # it might be a dynamic host folder (like ./hosts/HOSTNAME)
                          if is_dir_import:
                              org_dir = os.path.dirname(full_path) # strip default.nix
                              node.add(f"[dim yellow]📂 {os.path.basename(org_dir)}/ (Dynamic/No default.nix)[/dim]")
                          else:
                              node.add(f"[red]BROKEN: {imp}[/] [dim]({full_path})[/]")

              root_node = Tree(f"[bold blue]{ROOT_DIR}[/]")
              entry_point = os.path.join(ROOT_DIR, "hosts/default.nix")
              if os.path.exists(entry_point):
                  node = root_node.add(f"[bold cyan]🚀 hosts/default.nix[/]")
                  add_node(entry_point, node)
                  CONSOLE.print(root_node)
              else:
                  CONSOLE.print("[red]Could not find hosts/default.nix[/]")

          def visualize_folder(self):
              """Visualizes folder structure with Import Dependencies"""
              target_name = Prompt.ask("Enter folder name to visualize (e.g. astal)")
              
              target_path = None
              for root, dirs, _ in os.walk(ROOT_DIR):
                  if target_name in dirs:
                      target_path = os.path.join(root, target_name)
                      break
              
              if not target_path:
                  CONSOLE.print(f"[red]Folder '{target_name}' not found.[/]")
                  return

              tree = Tree(f"[bold yellow]📂 {target_name}[/] [dim]({target_path})[/]")
              
              # Map for quick lookup to prevent cycles and redundant nodes
              file_nodes = {}

              def add_file_node(fpath, parent_node):
                  # Use full path as key to avoid issues with same filenames in different dirs
                  if fpath in file_nodes: return file_nodes[fpath] 

                  fname = os.path.basename(fpath)
                  
                  if fname.endswith((".tsx", ".ts")): icon = "📘"
                  elif fname.endswith(".js"): icon = "🟨"
                  elif fname.endswith(".css"): icon = "🎨"
                  else: icon = "📄"
                  
                  node = parent_node.add(f"{icon} {fname}")
                  file_nodes[fpath] = node # Store node reference
                  
                  # Parse imports only for relevant file types
                  if fpath in self.analyzer.files and fpath.endswith((".js", ".ts", ".tsx", ".css")):
                      content = self.analyzer.files[fpath]
                      # Regex for JS/TS imports: import X from './Y' or import './Y'
                      # Very naive, but visual
                      # Captures relative paths like './module' or '../module'
                      imports = re.findall(r'(?:from\s+[\'\"]|import\s+[\'\"])(?P<path>\.?\./[^"\'\s]+)[\'\"]', content)
                      
                      for imp in imports:
                          # Resolve relative path
                          base = os.path.dirname(fpath)
                          resolved = os.path.normpath(os.path.join(base, imp))
                          
                          # Try common extensions if not already a file
                          found = False
                          if os.path.exists(resolved) and os.path.isfile(resolved):
                              found = True
                          else:
                              for ext in ["", ".ts", ".tsx", ".js", ".css"]: # "" for index.js/ts or direct file
                                  if os.path.exists(resolved + ext) and os.path.isfile(resolved + ext):
                                      resolved += ext
                                      found = True
                                      break
                          
                          if found:
                              # Add as child node, passing the current node as parent
                              add_file_node(resolved, node)
                          elif not re.search(r'\.(png|svg|jpg|jpeg|gif)$', imp): # Ignore common asset imports
                              node.add(f"[dim]↳ {imp} (external)[/dim]")
                  return node

              # Recursively add files and their dependencies
              for root, dirs, files in os.walk(target_path):
                  # Sort for consistent output
                  dirs.sort()
                  files.sort()

                  # current_node = tree # Default to root for top-level files/dirs
                  # The original logic for current_node was commented out or simplified.
                  # For simplicity, we'll just add files directly under the main tree
                  # or a simple branch for the directory itself.
                  # A full recursive tree build would require mapping parent nodes.
                  # For now, let's just add files directly to the main tree or a simple dir node.
                  
                  for f in files:
                      full_file_path = os.path.join(root, f)
                      add_file_node(full_file_path, tree) # Add all files directly under the main tree for now

              CONSOLE.print(tree)


          def audit_packages(self):
              """Consolidated Audit: Redundant, Implicit, and Ghost packages"""
              redundant, implicit, ghosts, _, _ = self.analyzer.analyze_duplication()
              
              CONSOLE.print(Panel("[bold white]🛡️ Package Audit Report[/]", expand=False))

              # 1. Redundant
              if redundant:
                  table = Table(title="⚠️  Redundant Packages (Remove from List)", show_header=True, header_style="bold red", width=100)
                  table.add_column("Program", style="white")
                  table.add_column("Installed via List", style="yellow")
                  table.add_column("Managed via Config", style="cyan")
                  for d in redundant:
                      table.add_row(d["name"], "\n".join(d["installed_in"]), "\n".join(d["configured_in"]))
                  CONSOLE.print(table)
              else:
                  CONSOLE.print("[bold green]✨ No redundant packages found![/]")
              
              CONSOLE.print("") # Spacing

              # 2. Ghosts
              if ghosts:
                  table = Table(title="👻 Ghost Packages (Hidden Configs)", show_header=True, header_style="bold white", width=100)
                  table.add_column("Program Name", style="bold green")
                  table.add_column("Configured In", style="dim")
                  table.caption = "These are configured but NOT unknown to your packages.nix mental map."
                  for g in ghosts:
                      table.add_row(g["name"], g["file"])
                  CONSOLE.print(table)
              else:
                  CONSOLE.print("[bold green]✨ No ghost packages found! All configs are mapped.[/]")

              CONSOLE.print("") # Spacing

              # 3. Implicit (Good)
              if implicit:
                  CONSOLE.print("[bold]✅ Validated Configs (Mentally Mapped):[/bold]")
                  # Compact display
                  grid = Table.grid(padding=(0, 2))
                  grid.add_column(style="dim")
                  grid.add_column(style="dim")
                  
                  # Split into 2 columns if list is long
                  half = (len(implicit) + 1) // 2
                  for i in range(half):
                      item1 = implicit[i]
                      col1 = f"- {item1['name']} ({os.path.basename(item1['file'])})"
                      
                      if i + half < len(implicit):
                          item2 = implicit[i+half]
                          col2 = f"- {item2['name']} ({os.path.basename(item2['file'])})"
                      else:
                          col2 = ""
                      grid.add_row(col1, col2)
                      
                  CONSOLE.print(grid)


          def show_install_map(self):
              """The Mega Map of every installed package + Configured Programs"""
              _, _, _, installed, configured = self.analyzer.analyze_duplication()
              
              # Merge keys from both dictionaries
              all_pkgs = set(installed.keys()) | set(configured.keys())
              sorted_pkgs = sorted(list(all_pkgs))
              
              table = Table(title=f"📦 Universal Install Map ({len(sorted_pkgs)} items)", show_header=True, header_style="bold blue")
              table.add_column("Package / Program", style="bold white")
              table.add_column("Source / Definition", style="green")

              for p in sorted_pkgs:
                  sources = []
                  if p in installed:
                      sources.extend([f"List ({os.path.basename(f)})" for f in installed[p]])
                  if p in configured:
                      # For configured items, we can't easily get the specific file for each config,
                      # so we just indicate it's configured and list the files where it's configured.
                      # The original code had `configured[p]` as a list of files.
                      sources.extend([f"Config (programs.{p} in {os.path.basename(f)})" for f in configured[p]])
                  
                  table.add_row(p, ", ".join(sources))
              
              CONSOLE.print(table)


          def format_size(self, bytes_val):
              for unit in ['B', 'KiB', 'MiB', 'GiB']:
                  if bytes_val < 1024.0:
                      return f"{bytes_val:.1f} {unit}"
                  bytes_val /= 1024.0
              return f"{bytes_val:.1f} TiB"

          def show_disk_usage(self):
              CONSOLE.print(Panel("[bold cyan]💾 System Disk Usage (Top 20)[/]", expand=False))
              CONSOLE.print("[dim italic]Querying Nix store (this may take a few seconds)...[/]")

              try:
                  cmd = ["nix", "path-info", "-r", "-s", "-S", "--json", "/run/current-system"]
                  result = subprocess.run(cmd, capture_output=True, text=True)

                  if result.returncode != 0:
                      CONSOLE.print(f"[red]Nix command failed:[/red] {result.stderr}")
                      return

                  data = json.loads(result.stdout)
                  packages = []
                  
                  for path, info in data.items():
                      name = os.path.basename(path)
                      if len(name) > 33: name = name[33:]
                      packages.append({
                          "name": name,
                          "self": info["narSize"],
                          "closure": info["closureSize"]
                      })

                  # --- Top Self Size ---
                  packages.sort(key=lambda x: x["self"], reverse=True)
                  table_self = Table(title="Top 20 'Fat' Packages (Individual Size)", header_style="bold yellow")
                  table_self.add_column("Package", style="white")
                  table_self.add_column("Size", justify="right", style="yellow")
                  
                  for p in packages[:20]:
                      table_self.add_row(p["name"], self.format_size(p["self"]))
                  
                  # --- Top Closure Size ---
                  packages.sort(key=lambda x: x["closure"], reverse=True)
                  table_closure = Table(title="Top 20 Heaviest Families (Total Dependencies)", header_style="bold magenta")
                  table_closure.add_column("Package", style="white")
                  table_closure.add_column("Size", justify="right", style="magenta")

                  unique_closures = set()
                  count = 0
                  for p in packages:
                      if count >= 20: break
                      if p["closure"] in unique_closures: continue
                      unique_closures.add(p["closure"])
                      table_closure.add_row(p["name"], self.format_size(p["closure"]))
                      count += 1
                  
                  # Display side by side
                  from rich.columns import Columns
                  CONSOLE.print(Columns([table_self, table_closure]))

              except Exception as e:
                  CONSOLE.print(f"[red]Error analyzing disk usage:[/red] {e}")


          def show_code_stats(self):
              """Top 20 Files by LOC (with Char Count)"""
              target_name = Prompt.ask("Enter folder name to analyze (default: Lis-os)", default="root")
              
              target_path = None
              if target_name == "root":
                  target_path = ROOT_DIR
              # Flexible search: check relative to ROOT_DIR or absolute
              elif os.path.isabs(target_name) and os.path.exists(target_name):
                  target_path = target_name
              else:
                   for root, dirs, _ in os.walk(ROOT_DIR):
                       if target_name in dirs:
                           target_path = os.path.join(root, target_name)
                           break
              
              if not target_path or not os.path.exists(target_path):
                  CONSOLE.print(f"[red]Folder '{target_name}' not found.[/]")
                  return

              CONSOLE.print(f"[dim]Scanning {target_path}...[/dim]")
              
              stats = []
              
              for root, _, files in os.walk(target_path):
                  if "node_modules" in root or ".git" in root or "result" in root: continue
                  for f in files:
                      path = os.path.join(root, f)
                      try:
                          with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              content = fd.read()
                              lines = len(content.splitlines())
                              chars = len(content)
                              stats.append({
                                  "name": f,
                                  "rel_path": os.path.relpath(path, target_path),
                                  "lines": lines,
                                  "chars": chars
                              })
                      except Exception:
                          continue

              # Sort by LOC
              stats.sort(key=lambda x: x["lines"], reverse=True)
              top_files = stats[:20]

              # Single Table
              table = Table(title=f"Top 20 Largest Files ({os.path.basename(target_path)})", header_style="bold blue")
              table.add_column("#", style="dim", justify="right", width=4)
              table.add_column("File", style="white")
              table.add_column("LOC", justify="right", style="cyan")
              table.add_column("Chars", justify="right", style="magenta")
              
              for idx, item in enumerate(top_files, 1):
                  path_display = item["rel_path"]
                  if len(path_display) > 50: path_display = "..." + path_display[-47:]
                  table.add_row(
                      str(idx), 
                      path_display, 
                      f"{item['lines']:,}", 
                      f"{item['chars']:,}"
                  )

              CONSOLE.print(table)


          def analyze_folder_weights(self):
              """Recursive Folder Weight Analysis"""
              target_name = Prompt.ask("Enter folder name to analyze (default: Lis-os)", default="root")
              
              target_path = None
              if target_name == "root":
                  target_path = ROOT_DIR
              elif os.path.isabs(target_name) and os.path.exists(target_name):
                  target_path = target_name
              else:
                   for root, dirs, _ in os.walk(ROOT_DIR):
                       if target_name in dirs:
                           target_path = os.path.join(root, target_name)
                           break
              
              if not target_path or not os.path.exists(target_path):
                  CONSOLE.print(f"[red]Folder '{target_name}' not found.[/]")
                  return

              CONSOLE.print(f"[dim]Calculating folder weights for: {target_path}... (Use Ctrl+C to stop)[/dim]")
              
              # Map: folder_path -> {lines: 0, chars: 0}
              # We need to accumulate bottom-up or just sum everything?
              # "Total lines inside this folder (recursive)"
              
              folder_stats = {}
              
              for root, dirs, files in os.walk(target_path):
                  # Filter common garbage for the walker, but we WANT node_modules to show up if selected,
                  # however, if we are scanning Root, we might want to see them.
                  # The user specifically said "node_module folder is over 1 millions tokens used so we need to make LLM tool not dump it"
                  # but "make a tool in nix_inspect that list the total lines and charater of a folder".
                  # So we SHOULD include node_modules in the stats to shame it.
                  
                  if ".git" in root or "result" in root: continue
                  
                  current_lines = 0
                  current_chars = 0
                  
                  for f in files:
                      path = os.path.join(root, f)
                      try:
                          # Quick read, maybe binary check?
                          # Just ignore errors
                          with open(path, "r", encoding="utf-8", errors="ignore") as fd:
                              # Reading strictly for stats, not loading all into memory at once if possible?
                              # But we need lines.
                              # For speed on massive node_modules, maybe just file size? 
                              # User asked for "lines and charater".
                              content = fd.read()
                              current_lines += len(content.splitlines())
                              current_chars += len(content)
                      except Exception:
                          continue

                  # Add to current folder AND all parents up to target_path
                  temp_path = root
                  while True:
                      if temp_path not in folder_stats:
                          folder_stats[temp_path] = {"lines": 0, "chars": 0}
                      
                      folder_stats[temp_path]["lines"] += current_lines
                      folder_stats[temp_path]["chars"] += current_chars
                      
                      if temp_path == target_path:
                          break
                      parent = os.path.dirname(temp_path)
                      if len(parent) < len(target_path): # Should not happen if walking inside target
                          break
                      temp_path = parent

              # Sort
              sorted_folders = []
              for p, s in folder_stats.items():
                  sorted_folders.append({
                      "path": p,
                      "rel_path": os.path.relpath(p, target_path),
                      "lines": s["lines"],
                      "chars": s["chars"]
                  })

              # Sort by Chars (Tokens proxy)
              sorted_folders.sort(key=lambda x: x["chars"], reverse=True)
              
              # Table
              table = Table(title=f"Top 20 Heaviest Folders ({os.path.basename(target_path)})", header_style="bold red")
              table.add_column("#", style="dim", justify="right", width=4)
              table.add_column("Folder Path", style="white")
              table.add_column("Total LOC", justify="right", style="cyan")
              table.add_column("Total Chars", justify="right", style="magenta")
              
              for idx, item in enumerate(sorted_folders[:20], 1):
                  path_display = item["rel_path"]
                  if path_display == ".": path_display = "[ROOT]"
                  if len(path_display) > 50: path_display = "..." + path_display[-47:]
                  
                  table.add_row(
                      str(idx),
                      path_display,
                      f"{item['lines']:,}",
                      f"{item['chars']:,}"
                  )
              
              CONSOLE.print(table)


          def run(self):
              next_choice = None # Stores a choice if user types it at the prompt
              try:
                  while True:
                      self.clear()
                      CONSOLE.print("[bold]Available Commands:[/bold]")
                      CONSOLE.print(" [1] [cyan]Tree View[/]      (Nix Dependencies)")
                      CONSOLE.print(" [2] [yellow]Package Audit[/]  (Redundant & Ghost Checks)")
                      CONSOLE.print(" [3] [blue]Install Map[/]    (Universal Map)")
                      CONSOLE.print(" [4] [red]Disk Usage[/]     (Analyze sizes)")
                      CONSOLE.print(" [5] [magenta]Vis. Folder[/]    (Inspect non-nix folders)")
                      CONSOLE.print(" [6] [green]Code Stats[/]     (LOC & Char counts)")
                      CONSOLE.print(" [7] [red]Folder Weights[/] (Recursive Size)")
                      CONSOLE.print(" [q] Quit")
                      
                      if next_choice:
                          choice = next_choice
                          next_choice = None # Reset after using
                      else:
                          choice = Prompt.ask("\nSelect", choices=["1", "2", "3", "4", "5", "6", "7", "q"], default="1")
                      
                      if choice == "q": break
                      elif choice == "1": self.show_tree()
                      elif choice == "2": self.audit_packages()
                      elif choice == "3": self.show_install_map()
                      elif choice == "4": self.show_disk_usage()
                      elif choice == "5": self.visualize_folder()
                      elif choice == "6": self.show_code_stats()
                      elif choice == "7": self.analyze_folder_weights()
                      
                      # Smart Pause: If user types a valid menu number, jump to it next
                      res = Prompt.ask("\n[dim]Press Enter to continue or type number...[/dim]")
                      if res in ["1", "2", "3", "4", "5", "6", "7", "q"]:
                          next_choice = res

              except KeyboardInterrupt:
                  CONSOLE.print("\n[bold red]Exiting...[/bold red]")
                  sys.exit(0)

      if __name__ == "__main__":
          Dashboard().run()

    '')
  ];
}
