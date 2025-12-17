"""
Template Renderer
Performs {key} → value substitution for legacy template compatibility.
"""
import shutil
from pathlib import Path
from typing import Dict, Any


def render_template(template_path: Path, output_path: Path, context: Dict[str, Any]):
    """
    Render a template by replacing {key} placeholders with values.
    Uses atomic write to prevent partial file corruption.
    """
    if not template_path.exists():
        print(f"Warning: Template not found: {template_path}")
        return

    with open(template_path, 'r') as f:
        content = f.read()
        
    # Flatten context: {"colors": {...}} → {...}
    data = context.get("colors", context)
    
    # Legacy {key} replacement (matches sed s|{key}|val|g behavior)
    for key, value in data.items():
        placeholder = f"{{{key}}}"
        content = content.replace(placeholder, str(value))
        
    # Atomic Write
    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_suffix('.tmp')
    
    with open(tmp_path, 'w') as f:
        f.write(content)
        
    shutil.move(tmp_path, output_path)
