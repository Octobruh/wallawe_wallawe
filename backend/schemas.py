from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re


list_kelurahan = [
    "Baciro", "Bausasran", "Bener", "Brontokusuman", "Bumijo", 
    "Cokrodiningratan", "Demangan", "Gedongkiwo", "Giwangan", "Gowongan", 
    "Gunungketur", "Kadipaten", "Karangwaru", "Keparakan", "Klitren", 
    "Kotabaru", "Kricak", "Mantrijeron", "Muja Muju", "Ngampilan", 
    "Ngupasan", "Notoprajan", "Pakuncen", "Pandeyan", "Panembahan", 
    "Patangpuluhan", "Patehan", "Prawirodirjan", "Prenggan", "Pringgokusuman", 
    "Purbayan", "Purwokinanti", "Rejowinangun", "Semaki", "Sorosutan", 
    "Sosromenduran", "Suryatmajan", "Suryodiningratan", "Tahunan", "Tegalpanggung", 
    "Tegalrejo", "Terban", "Warungboto", "Wirobrajan", "Wirogunan"
]

KelurahanJogja = Enum(
    "KelurahanJogja", 
    {k.upper().replace(" ", "_"): k for k in list_kelurahan}, 
    type=str
)

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
    @field_validator('day')
    @classmethod
    def validate_day(cls, v: str):
        hari_valid = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
        if v not in hari_valid:
            raise ValueError(f'Hari tidak valid. Pilih antara: {", ".join(hari_valid)}')
        return v

    @field_validator('time')
    @classmethod
    def validate_time(cls, v: str):
        # Regex for pattern HH:mm-HH:mm
        # ^\d{2}:\d{2}-\d{2}:\d{2}$
        pattern = r'^\d{2}:\d{2}-\d{2}:\d{2}$'
        if not re.match(pattern, v):
            raise ValueError('Format waktu harus HH:mm-HH:mm (contoh: 07:00-08:00)')
        start_time, end_time = v.split('-')
        if end_time > "18:00":
            raise ValueError(f'Jadwal tidak boleh melebihi pukul 18:00. Input Anda {end_time}')
        if start_time < "07:00":
            raise ValueError(f'Jadwal tidak boleh kurang dari pukul 07:00. Input Anda {start_time}')
        if start_time >= end_time:
            raise ValueError(f'Waktu mulai tidak boleh melebihi jadwal akhir.')

        return v
    

class Schedule(ScheduleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
