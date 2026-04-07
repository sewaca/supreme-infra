import json
import os
from pathlib import Path

os.environ["SKIP_INSTRUMENTATION"] = "1"

from app.main import app

schema = app.openapi()
output = Path(__file__).parent.parent / "openapi.json"
output.write_text(json.dumps(schema, indent=2, ensure_ascii=False))
print(f"OpenAPI schema exported to {output}")
