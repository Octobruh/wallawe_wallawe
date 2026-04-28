from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas, database, auth
from sqlalchemy import case, desc

app = FastAPI(title="Wallawe API")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Wallawe API"}

# Login endpoint

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Salah username atau password")
    
    # get token from auth.py
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Complaints Endpoints ---

@app.post("/complaints/", response_model=schemas.Complaint)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(database.get_db)):
    db_complaint = models.Complaint(**complaint.model_dump())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

@app.get("/complaints/", response_model=List[schemas.Complaint])
def read_complaints(kelurahan: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    query = db.query(models.Complaint)
    # If they want to sort based on the kelurahan
    if kelurahan:
        query = query.filter(models.Complaint.kelurahan == kelurahan)
    complaints = query.order_by(desc(models.Complaint.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()
    return complaints

# --- Schedules Endpoints ---

@app.get("/schedules/", response_model=List[schemas.Schedule])
def read_schedules(day: Optional[str] = None, db: Session = Depends(database.get_db)):
    day_order = case(
        {
            "Senin": 1,
            "Selasa": 2,
            "Rabu": 3,
            "Kamis": 4,
            "Jumat": 5,
            "Sabtu": 6,
            "Minggu": 7
        },
        value=models.Schedule.day
    )
    query = db.query(models.Schedule)
    if day:
        query = query.filter(models.Schedule.day == day)
    return query.order_by(day_order, models.Schedule.time).all()

@app.post("/schedules/", response_model=schemas.Schedule)
def add_schedule(
    schedule: schemas.ScheduleCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user) # Proteksi aktif
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Hanya admin yang bisa menambah jadwal")
        
    db_schedule = models.Schedule(**schedule.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@app.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user) # Tambahkan ini
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Hanya admin yang bisa menghapus jadwal")
    db_schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    
    db.delete(db_schedule)
    db.commit()
    
    return {"message": f"Jadwal dengan ID {schedule_id} telah berhasil dihapus"}
