from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

app = FastAPI(title="Wallawe API")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Wallawe API"}

# --- Complaints Endpoints ---

@app.post("/complaints/", response_model=schemas.Complaint)
def create_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(database.get_db)):
    db_complaint = models.Complaint(**complaint.model_dump())
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

@app.get("/complaints/", response_model=List[schemas.Complaint])
def read_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    complaints = db.query(models.Complaint).offset(skip).limit(limit).all()
    return complaints

# --- Schedules Endpoints ---

@app.get("/schedules/", response_model=List[schemas.Schedule])
def read_schedules(db: Session = Depends(database.get_db)):
    return db.query(models.Schedule).all()
