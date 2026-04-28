from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str
    kelurahan_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Complaint Schemas ---
class ComplaintBase(BaseModel):
    kelurahan: str
    rt: int
    rw: int
    jalan: str
    description_location: str
    complaint_text: str
    photo_url: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class Complaint(ComplaintBase):
    id: int
    status: str
    admin_photo_url: Optional[str] = None
    priority_score: int
    is_approved: bool
    created_at: datetime
    user_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Schedule Schemas ---
class ScheduleBase(BaseModel):
    day: str
    time: str
    kelurahan_target: str

class ScheduleCreate(ScheduleBase):
    pass

class Schedule(ScheduleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
