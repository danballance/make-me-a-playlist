"""Verify schema/openapi.json matches the app's generated schema."""

import json
from pathlib import Path

from api.main import create_app


def test_schema_file_is_current() -> None:
    app = create_app()
    generated = app.openapi_schema.to_schema()
    schema_path = (
        Path(__file__).resolve().parent.parent.parent / "schema" / "openapi.json"
    )
    on_disk = json.loads(schema_path.read_text())
    assert generated == on_disk, (
        "schema/openapi.json is out of date. "
        "Run: cd backend && uv run python export_schema.py"
    )
