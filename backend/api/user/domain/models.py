from pydantic import BaseModel


class User(BaseModel, frozen=True):
    username: str
    email: str
