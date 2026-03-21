from api.user.domain.models import User


def test_user_creation() -> None:
    user = User(username="alice", email="alice@example.com")
    assert user.username == "alice"
    assert user.email == "alice@example.com"
