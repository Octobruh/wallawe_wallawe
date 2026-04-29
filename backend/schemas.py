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

class NamaHari(str, Enum):
    SENIN = "Senin"
    SELASA = "Selasa"
    RABU = "Rabu"
    KAMIS = "Kamis"
    JUMAT = "Jumat"
    SABTU = "Sabtu"
    MINGGU = "Minggu"

class StatusComplaint(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    REJECTED = "rejected"
    SOLVED = "solved"

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class UserKelurahanResponse(BaseModel):
    kelurahan_name: str
    model_config = ConfigDict(from_attributes=True)
    
class User(UserBase):
    id: int
    accessible_kelurahans: List[UserKelurahanResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- Complaint Schemas ---
class ComplaintBase(BaseModel):
    kelurahan: KelurahanJogja
    rt: int
    rw: int
    jalan: str
    description_location: str
    complaint_text: str
    photo_url: Optional[str] = None
    status: StatusComplaint = StatusComplaint.PENDING

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


class ComplaintStatusUpdate(BaseModel):
    is_approved: bool
    status: StatusComplaint # pending, processed, rejected, solved

class ComplaintSolve(BaseModel):
    admin_photo_url: str

# --- Schedule Schemas ---
class ScheduleBase(BaseModel):
    day: NamaHari
    time: str
    kelurahan_target: KelurahanJogja

class ScheduleCreate(ScheduleBase):
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
