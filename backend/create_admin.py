from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models
from passlib.context import CryptContext
import getpass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_initial_admin():
    print("--- Setup Akun Admin Wallawe ---")
    db = SessionLocal()
    username = input("Masukkan Username Admin: ")
    
    password = getpass.getpass("Masukkan Password Admin: ")
    confirm_password = getpass.getpass("Konfirmasi Password: ")

    if password != confirm_password:
        print("Error: Password tidak cocok!")
        return

    existing_user = db.query(models.User).filter(models.User.username == username).first()
    if existing_user:
        print(f"Error: Username '{username}' sudah terdaftar.")
        return

    new_admin = models.User(
        username=username,
        hashed_password=pwd_context.hash(password),
        role="admin"
    )
    
    try:
        db.add(new_admin)
        db.commit()
        print(f"\nSukses! Admin '{username}' berhasil dibuat.")
    except Exception as e:
        db.rollback()
        print(f"Terjadi kesalahan saat menyimpan ke database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin()
