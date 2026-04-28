import getpass
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_interactive_user():
    db = SessionLocal()
    
    print("--- Setup Akun User Kelurahan Wallawe ---")
    
    username = input("Masukkan Username User: ")
    
    password = getpass.getpass("Masukkan Password User: ")
    confirm_password = getpass.getpass("Konfirmasi Password: ")

    if password != confirm_password:
        print("Error: Password tidak cocok!")
        return

    existing_user = db.query(models.User).filter(models.User.username == username).first()
    if existing_user:
        print(f"Error: Username '{username}' sudah digunakan.")
        return

    print("\nInformasi Wilayah:")
    print("Contoh input: Grendeng, Sumampir, Bancarkembar")
    kelurahan_input = input("Masukkan Nama Kelurahan (pisahkan dengan koma): ")
    
    nama_kelurahans = [k.strip() for k in kelurahan_input.split(",") if k.strip()]
    
    if not nama_kelurahans:
        print("Error: User kelurahan minimal harus memiliki satu akses wilayah.")
        return

    try:
        hashed_password = pwd_context.hash(password)

        new_user = models.User(
            username=username,
            hashed_password=hashed_password,
            role="kelurahan"
        )
        db.add(new_user)
        
        db.flush()

        for nama in nama_kelurahans:
            akses = models.UserKelurahan(
                user_id=new_user.id, 
                kelurahan_name=nama
            )
            db.add(akses)

        db.commit()
        print(f"\nSukses! Akun '{username}' berhasil dibuat.")
        print(f"Akses Wilayah: {', '.join(nama_kelurahans)}")

    except Exception as e:
        db.rollback()
        print(f"Terjadi kesalahan saat menyimpan ke database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_interactive_user()
