from pydantic import BaseModel


class TodoItem(BaseModel, frozen=True):
    title: str
    done: bool
