from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base # Asumsi Anda punya Base dari SQLAlchemy setup

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin' atau 'kelurahan'
    kelurahan_name = Column(String, nullable=True) # Spesifik untuk akun kelurahan

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    # Lokasi
    kelurahan = Column(String, index=True)
    rt = Column(Integer)
    rw = Column(Integer)
    jalan = Column(String)
    description_location = Column(Text)
    
    # Isi Keluhan
    complaint_text = Column(Text)
    photo_url = Column(String) # Bukti dari user
    
    # Status & Admin
    status = Column(String, default="pending") # pending, solved
    admin_photo_url = Column(String, nullable=True) # Bukti dari admin
    priority_score = Column(Integer, default=0) # Untuk AI NLP nantinya
    is_approved = Column(Boolean, default=False) # Approval dari koordinator
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String) # Senin - Minggu
    time = Column(String) # Format jam
    kelurahan_target = Column(String)
