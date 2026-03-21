import pytest

import schemathesis

from api.main import create_app

schema = schemathesis.openapi.from_asgi("/schema/openapi.json", create_app())


@pytest.mark.schemathesis
@schema.parametrize()
def test_api(case):
    case.call_and_validate()
