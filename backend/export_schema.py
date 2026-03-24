"""Export the Litestar app's OpenAPI schema to schema/openapi.json."""

import json
from pathlib import Path

from api.main import create_app


def export_schema() -> None:
    app = create_app()
    schema = app.openapi_schema
    output = Path(__file__).resolve().parent.parent / "schema" / "openapi.json"
    schema_text = json.dumps(schema.to_schema(), indent=2)
    output.write_text(f"{schema_text}\n")


if __name__ == "__main__":
    export_schema()
