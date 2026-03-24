"""Playlist domain exceptions."""


class SessionNotFoundError(Exception):
    """Raised when a session ID does not exist."""


class SessionCompleteError(Exception):
    """Raised when trying to reply to a completed session."""
