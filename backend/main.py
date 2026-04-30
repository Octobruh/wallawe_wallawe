from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas, database, auth
from sqlalchemy import case, desc
import shutil
import uuid
from pathlib import Path
from datetime import datetime

app = FastAPI(title="Wallawe API")

BASE_UPLOAD_DIR = Path("uploads")
COMPLAINTS_DIR = BASE_UPLOAD_DIR / "complaints"
SOLVED_DIR = BASE_UPLOAD_DIR / "solved"

BASE_UPLOAD_DIR.mkdir(exist_ok=True)
COMPLAINTS_DIR.mkdir(parents=True, exist_ok=True)
SOLVED_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory="uploads"), name="static")
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

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- Complaints Endpoints ---

@app.post("/complaints/", response_model=schemas.Complaint)
def create_complaint(
    # --- Text Input ---
    kelurahan: schemas.KelurahanJogja = Form(...),
    rt: int = Form(...),
    rw: int = Form(...),
    jalan: str = Form(...),
    description_location: str = Form(...),
    complaint_text: str = Form(...),
    
    # --- File Input ---
    file: UploadFile = File(...),
    
    db: Session = Depends(database.get_db)
):
    # 1. File Validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File wajib berupa gambar (JPEG, PNG, dll)")

    # 2. Saving File
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}" 
    file_path = COMPLAINTS_DIR / unique_filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan foto: {str(e)}")

    # 3. Saving to Database
    new_complaint = models.Complaint(
        kelurahan=kelurahan.value, 
        rt=rt,
        rw=rw,
        jalan=jalan,
        description_location=description_location,
        complaint_text=complaint_text,
        photo_url=f"/static/complaints/{unique_filename}", 
        status=schemas.StatusComplaint.PENDING.value
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint

@app.get("/complaints/", response_model=List[schemas.Complaint])
def read_complaints(
    kelurahan: Optional[schemas.KelurahanJogja] = None, 
    status: Optional[schemas.StatusComplaint] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Complaint)
    # If they want to sort based on the kelurahan
    if kelurahan:
        query = query.filter(models.Complaint.kelurahan == kelurahan.value)
    if status:
        query = query.filter(models.Complaint.status == status.value)
    complaints = query.order_by(desc(models.Complaint.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()
    return complaints


@app.patch("/complaints/assigned/{complaint_id}/status", response_model=schemas.Complaint)
def update_complaint_status_kelurahan(
    complaint_id: int,
    status_update: schemas.ComplaintStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    if current_user.role != "kelurahan":
        raise HTTPException(status_code=403, detail="Endpoint ini khusus untuk staf kelurahan")

    allowed_kelurahans = [k.kelurahan_name for k in current_user.accessible_kelurahans]
    if db_complaint.kelurahan not in allowed_kelurahans:
        raise HTTPException(status_code=403, detail=f"Anda tidak memiliki akses di {db_complaint.kelurahan}")


    if status_update.status not in [schemas.StatusComplaint.PENDING, schemas.StatusComplaint.PROCESSED, schemas.StatusComplaint.REJECTED]:
        raise HTTPException(status_code=400, detail="Status tidak valid untuk aksi ini")

    db_complaint.is_approved = status_update.is_approved
    db_complaint.status = status_update.status
    db_complaint.approved_by = current_user.id

    db.commit()
    db.refresh(db_complaint)
    return db_complaint

# Endpoint for user dashboard
@app.get("/complaints/assigned", response_model=List[schemas.Complaint])
def read_assigned_complaints(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Complaint)

    if current_user.role != "admin":
        allowed_kelurahans = [k.kelurahan_name for k in current_user.accessible_kelurahans]
        query = query.filter(models.Complaint.kelurahan.in_(allowed_kelurahans))

    complaints = query.order_by(desc(models.Complaint.created_at)).all()
    
    return complaints

@app.patch("/complaints/{complaint_id}/solve", response_model=schemas.Complaint)
def solve_complaint(
    complaint_id: int,
    admin_photo: UploadFile = File(...), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Hanya Admin yang dapat menyelesaikan laporan")

    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan")

    if not admin_photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File bukti wajib berupa gambar")

    file_extension = Path(admin_photo.filename).suffix
    unique_filename = f"solved_{uuid.uuid4()}{file_extension}" 
    file_path = SOLVED_DIR / unique_filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(admin_photo.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan foto bukti: {str(e)}")

    db_complaint.status = schemas.StatusComplaint.SOLVED
    db_complaint.admin_photo_url = f"/static/solved/{unique_filename}" 
    db_complaint.solved_at = datetime.now() 

    db.commit()
    db.refresh(db_complaint)
    
    return db_complaint

# --- Schedules Endpoints ---

@app.get("/schedules/", response_model=List[schemas.Schedule])
def read_schedules(day: Optional[schemas.NamaHari] = None, db: Session = Depends(database.get_db)):
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
        query = query.filter(models.Schedule.day == day.value)
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
    current_user: models.User = Depends(auth.get_current_user) 
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Hanya admin yang bisa menghapus jadwal")
    db_schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    
    db.delete(db_schedule)
    db.commit()
    
    return {"message": f"Jadwal dengan ID {schedule_id} telah berhasil dihapus"}

@app.get("/schedules/unscheduled", response_model=List[str])
def get_unscheduled_kelurahans(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Hanya admin yang dapat melihat status jadwal menyeluruh")

    scheduled_query = db.query(models.Schedule.kelurahan_target).all()
    

    scheduled_kelurahans = [item[0] for item in scheduled_query]
    kelurahans = schemas.list_kelurahan
    scheduled_set = set(scheduled_kelurahans)
    unscheduled = [k for k in kelurahans if k not in scheduled_set]
    
    return unscheduled
