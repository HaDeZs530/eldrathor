#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
python3 - <<PY
from pathlib import Path
import base64, hashlib
root = Path("$ROOT")
def load_part(i: int) -> str:
    p = root / f"part{i:02d}.b64"
    if p.exists():
        return p.read_text().strip()
    qs = sorted(root.glob(f"part{i:02d}q*.b64"))
    assert qs, f"missing part {i:02d}"
    return "".join(q.read_text().strip() for q in qs)
b64 = "".join(load_part(i) for i in range(10))
data = base64.b64decode(b64)
expected = "2162368bf7186ba2b12e1ede4a09de03fe1f5fce2b19670e525b574e3ac8f7a3"
got = hashlib.sha256(data).hexdigest()
assert got == expected, (got, expected)
out = root.parent / "Eldrathor_Design_Doc.md"
out.write_bytes(data)
print("wrote", out, len(data), got)
PY
