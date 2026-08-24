from datetime import date

from pydantic import BaseModel

'''
Pydantic schemas defining the data validation and serialization for API requests and responses.
'''

class TaskResponse(BaseModel):
    task_id: str
    title: str | None = None
    status: str | None = None
    due_date: date | None = None
    importance: str | None = None

    model_config = {"from_attributes": True}
