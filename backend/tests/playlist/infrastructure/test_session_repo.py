"""Tests for in-memory session repository."""

import pytest

from api.playlist.infrastructure.session_repo import InMemorySessionRepository


@pytest.fixture()
def repo() -> InMemorySessionRepository:
    return InMemorySessionRepository()


@pytest.mark.anyio()
async def test_create_returns_session_with_question(
    repo: InMemorySessionRepository,
) -> None:
    info = await repo.create(topic="advanced vim motions")

    assert info.session_id is not None
    assert len(info.session_id) > 0
    assert info.topic == "advanced vim motions"
    assert info.state == "conversing"
    assert info.response.kind == "question"
    assert info.response.message is not None


@pytest.mark.anyio()
async def test_create_generates_unique_session_ids(
    repo: InMemorySessionRepository,
) -> None:
    info_a = await repo.create(topic="topic a")
    info_b = await repo.create(topic="topic b")

    assert info_a.session_id != info_b.session_id


@pytest.mark.anyio()
async def test_get_returns_existing_session(
    repo: InMemorySessionRepository,
) -> None:
    created = await repo.create(topic="vim motions")
    fetched = await repo.get(session_id=created.session_id)

    assert fetched.session_id == created.session_id
    assert fetched.topic == created.topic
    assert fetched.state == created.state


@pytest.mark.anyio()
async def test_get_raises_key_error_for_unknown_session(
    repo: InMemorySessionRepository,
) -> None:
    with pytest.raises(KeyError):
        await repo.get(session_id="nonexistent")


@pytest.mark.anyio()
async def test_reply_returns_next_response(
    repo: InMemorySessionRepository,
) -> None:
    created = await repo.create(topic="vim motions")
    info = await repo.reply(
        session_id=created.session_id,
        message="I like tiny.nvim plugins",
    )

    assert info.session_id == created.session_id
    assert info.response.kind in {"question", "result"}


@pytest.mark.anyio()
async def test_reply_raises_key_error_for_unknown_session(
    repo: InMemorySessionRepository,
) -> None:
    with pytest.raises(KeyError):
        await repo.reply(session_id="nonexistent", message="hello")
