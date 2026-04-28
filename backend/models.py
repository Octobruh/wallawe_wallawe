from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin' or 'kelurahan'
    accessible_kelurahans = relationship("UserKelurahan", back_populates="owner")

class UserKelurahan(Base):
    __tablename__ = "user_kelurahans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    kelurahan_name = Column(String, index=True)
    
    owner = relationship("User", back_populates="accessible_kelurahans")

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    kelurahan = Column(String, index=True)
    rt = Column(Integer)
    rw = Column(Integer)
    jalan = Column(String)
    description_location = Column(Text)
    
    # Complaint description
    complaint_text = Column(Text)
    photo_url = Column(String) # proof from user
    
    # Status & Admin
    status = Column(String, default="pending") # pending, solved
    admin_photo_url = Column(String, nullable=True) # Proof from admin
    priority_score = Column(Integer, default=0) # From our AI NLP 
    is_approved = Column(Boolean, default=False) # Approval from kelurahan user
    category = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String) # Value: Senin - Minggu
    time = Column(String) # Hours format
    kelurahan_target = Column(String)
