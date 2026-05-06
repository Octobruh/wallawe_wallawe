from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from backend import models, schemas, database, auth
from sqlalchemy import case, desc
import uuid
import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import requests
from supabase import create_client, Client

load_dotenv()

app = FastAPI(title="Wallawe API")

# --- Inisialisasi Supabase Client ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL atau SUPABASE_KEY belum disetel di Environment Variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

origins = [
    "http://localhost:3000",
    "https://wallawe.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],   
)

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

@app.get("/users/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)) -> Any:
    if current_user.role != "admin":
        return schemas.User.model_validate(current_user)
    else:
        return schemas.Admin.model_validate(current_user)

# --- Complaints Endpoints ---

@app.post("/complaints/", response_model=schemas.ComplaintPublic)
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

    if not supabase:
        raise HTTPException(status_code=500, detail="Konfigurasi Supabase Storage belum tersedia")

    # 2. Uploading File to Supabase Storage
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}" 
    file_path_in_storage = f"complaints/{unique_filename}"

    try:
        file_bytes = file.file.read()
        supabase.storage.from_("wallawe-storage").upload(
            file=file_bytes,
            path=file_path_in_storage,
            file_options={"content-type": file.content_type}
        )
        public_url = supabase.storage.from_("wallawe-storage").get_public_url(file_path_in_storage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengunggah foto ke Storage: {str(e)}")
    
    # 3. Getting priority and case with AI NLP
    ai_url = os.getenv("AI_MODEL_URL")
    ai_payload = {"teks": complaint_text}
    priority_score = 0
    category = "Lainnya"
 
    try:
        response = requests.post(ai_url, json=ai_payload, timeout=10)
        
        if response.status_code == 200:
            ai_data = response.json()
            label_prioritas = ai_data["hasil_prediksi"]["prioritas"]["label"]
            priority_score = schemas.priority_map.get(label_prioritas, 0)
            category = ai_data["hasil_prediksi"]["kasus"]["kategori"]
        else:
            print(f"Warning: AI API returned status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error menghubungi AI: {e}")

    # 4. Saving to Database
    new_complaint = models.Complaint(
        kelurahan=kelurahan.value, 
        rt=rt,
        rw=rw,
        jalan=jalan,
        description_location=description_location,
        complaint_text=complaint_text,
        photo_url=public_url, # URL langsung dari Supabase
        status=schemas.StatusComplaint.PENDING.value,
        priority_score=priority_score,
        category=category
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint

@app.get("/complaints/")
def read_complaints(
    kelurahan: Optional[schemas.KelurahanJogja] = None, 
    status: Optional[schemas.StatusComplaint] = None,
    priority_score: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user)
) -> Any:
    query = db.query(models.Complaint)
    if kelurahan:
        query = query.filter(models.Complaint.kelurahan == kelurahan.value)
    if status:
        query = query.filter(models.Complaint.status == status.value)
    if priority_score is not None and current_user and current_user.role == "admin":
        query = query.filter(models.Complaint.priority_score == schemas.priority_map.get(priority_score, 0))
    complaints = query.order_by(desc(models.Complaint.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()
    if current_user and current_user.role == "admin":
        return [schemas.ComplaintAdmin.model_validate(c) for c in complaints]
    else:
        return [schemas.ComplaintPublic.model_validate(c) for c in complaints]

@app.patch("/complaints/assigned/{complaint_id}/status", response_model=schemas.ComplaintPublic)
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
@app.get("/complaints/assigned", response_model=List[schemas.ComplaintPublic])
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

@app.patch("/complaints/{complaint_id}/solve", response_model=schemas.ComplaintAdmin)
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

    if not supabase:
        raise HTTPException(status_code=500, detail="Konfigurasi Supabase Storage belum tersedia")

    file_extension = Path(admin_photo.filename).suffix
    unique_filename = f"solved_{uuid.uuid4()}{file_extension}" 
    file_path_in_storage = f"solved/{unique_filename}"

    try:
        file_bytes = admin_photo.file.read()
        supabase.storage.from_("wallawe-storage").upload(
            file=file_bytes,
            path=file_path_in_storage,
            file_options={"content-type": admin_photo.content_type}
        )
        public_url = supabase.storage.from_("wallawe-storage").get_public_url(file_path_in_storage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengunggah foto bukti ke Storage: {str(e)}")

    db_complaint.status = schemas.StatusComplaint.SOLVED
    db_complaint.admin_photo_url = public_url # URL langsung dari Supabase
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
    current_user: models.User = Depends(auth.get_current_user) 
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
