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

priority_map = {
        "Tinggi": 3,
        "Sedang": 2,
        "Rendah": 1,
        "Unknown": 0
    }
reverse_priority_map = {v: k for k, v in priority_map.items()}
# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str

# Note: This class is needed since models.User.accessible_kelurahans use relational stuff so we need this temporary class   
# So we can't just accessible_kelurahans: List[str] = []
class UserKelurahanResponse(BaseModel):
    kelurahan_name: str
    model_config = ConfigDict(from_attributes=True)

class User(UserBase):
    id: int
    accessible_kelurahans: List[UserKelurahanResponse] = []
    model_config = ConfigDict(from_attributes=True)

class Admin(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Complaint Schemas ---
class ComplaintBase(BaseModel):
    kelurahan: KelurahanJogja
    rt: int
    rw: int
    jalan: str
    description_location: str
    complaint_text: str

# Schema for User / Public
class ComplaintPublic(ComplaintBase):
    id: int
    photo_url: str 
    status: StatusComplaint
    created_at: datetime
    solved_at: Optional[datetime] = None
    admin_photo_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Schema for ADMIN ONLY
class ComplaintAdmin(ComplaintPublic):
    priority_score: Optional[str] = "Unknown"
    category: Optional[str] = "Belum Dikategorikan"
    approved_by: Optional[int] = None

    @field_validator('priority_score', mode='before')
    @classmethod
    def convert_score_to_label(cls, v):
        if isinstance(v, int):
            return reverse_priority_map.get(v, "Unknown")
        return v 

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
