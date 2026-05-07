# Wallawe

Wallawe adalah platform pengaduan dan pengelolaan masalah sampah untuk wilayah Kota Yogyakarta yang dapat diakses di [sini](https://wallawe.vercel.app). Aplikasi ini terdiri dari frontend Next.js dan backend FastAPI, dengan dukungan autentikasi, pengelolaan laporan, jadwal pengambilan sampah, unggah bukti foto, serta klasifikasi prioritas laporan melalui layanan AI eksternal.

## Fitur Utama

- Form pengaduan sampah publik dengan detail lokasi dan bukti foto.
- Daftar dan pemantauan status laporan.
- Dashboard untuk admin dan petugas kelurahan.
- Role-based access untuk `admin` dan `kelurahan`.
- Admin dapat melihat laporan seluruh wilayah, mengatur jadwal, dan menandai laporan selesai dengan foto bukti.
- Petugas kelurahan hanya dapat mengelola laporan sesuai wilayah aksesnya.
- Integrasi AI untuk menentukan prioritas dan kategori laporan berdasarkan teks pengaduan.
- Manajemen jadwal keliling berdasarkan hari, waktu, dan kelurahan target.
- Migrasi database menggunakan Alembic.

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic
- JWT authentication
- Passlib bcrypt

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide React

## Struktur Proyek

```text
.
|-- backend/
|   |-- main.py             # Entry point FastAPI dan definisi endpoint
|   |-- models.py           # Model database SQLAlchemy
|   |-- schemas.py          # Schema Pydantic dan enum aplikasi
|   |-- database.py         # Koneksi database
|   |-- auth.py             # JWT, hashing password, dan dependency auth
|   |-- create_admin.py     # Script interaktif membuat akun admin
|   `-- create_user.py      # Script interaktif membuat akun petugas kelurahan
|-- frontend/
|   |-- app/                # App Router Next.js
|   |-- components/         # Komponen UI
|   |-- lib/                # Utility frontend
|   `-- package.json        # Dependency dan script frontend
|-- alembic/
|   `-- versions/           # Riwayat migrasi database
|-- alembic.ini
|-- requirements.txt
`-- README.md
```

## Prasyarat

Pastikan sudah menginstal:

- Python 3.10 atau lebih baru
- Node.js 20 atau lebih baru
- npm
- PostgreSQL

## Environment Variables

### Backend

Buat file `.env` di root project:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/wallawe
SECRET_KEY=change-this-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
AI_MODEL_URL=http://localhost:8001/predict
```

Keterangan:

- `DATABASE_URL`: URL koneksi PostgreSQL.
- `SECRET_KEY`: secret untuk menandatangani JWT.
- `ALGORITHM`: algoritma JWT, contoh `HS256`.
- `ACCESS_TOKEN_EXPIRE_HOURS`: durasi masa aktif token login dalam jam.
- `AI_MODEL_URL`: endpoint layanan AI yang menerima payload `{"teks": "isi laporan"}`.

### Frontend

Buat file `.env.local` di folder `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Instalasi Backend

Jalankan dari root project:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Jika menggunakan Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Setup Database

1. Buat database PostgreSQL, contoh:

```bash
createdb wallawe
```

2. Pastikan `DATABASE_URL` di `.env` sudah sesuai.

3. Jalankan migrasi:

```bash
alembic upgrade head
```

## Menjalankan Backend

```bash
uvicorn backend.main:app --reload
```

Backend akan berjalan di:

```text
http://localhost:8000
```

Dokumentasi API otomatis tersedia di:

```text
http://localhost:8000/docs
```

File yang diunggah akan disimpan ke folder `uploads/` dan dilayani melalui path `/static`.

## Membuat Akun

Jalankan perintah berikut dari root project setelah database siap.

### Membuat Admin

```bash
python3 -m backend.create_admin
```

### Membuat Petugas Kelurahan

```bash
python3 -m backend.create_user
```

Script petugas kelurahan akan meminta daftar kelurahan yang dapat diakses. Pisahkan beberapa kelurahan dengan koma.

## Instalasi Frontend

Masuk ke folder frontend:

```bash
cd frontend
npm install
```

## Menjalankan Frontend

```bash
npm run dev
```

Frontend akan berjalan di:

```text
http://localhost:3000
```

Pastikan backend juga sedang berjalan dan `NEXT_PUBLIC_API_URL` mengarah ke URL backend yang benar.

## Script yang Tersedia

### Backend

```bash
uvicorn backend.main:app --reload
alembic upgrade head
python3 -m backend.create_admin
python3 -m backend.create_user
```

### Frontend

```bash
npm run dev      # Menjalankan development server
npm run build    # Build production
npm run start    # Menjalankan build production
npm run lint     # Menjalankan ESLint
```

## Ringkasan Endpoint API

### Auth

- `POST /token` - Login dan mendapatkan JWT access token.
- `GET /users/me` - Mengambil data user yang sedang login.

### Complaints

- `POST /complaints/` - Membuat laporan baru.
- `GET /complaints/` - Mengambil daftar laporan.
- `GET /complaints/assigned` - Mengambil laporan sesuai wilayah akses user.
- `PATCH /complaints/assigned/{complaint_id}/status` - Mengubah status laporan oleh petugas kelurahan.
- `PATCH /complaints/{complaint_id}/solve` - Menandai laporan selesai oleh admin.

### Schedules

- `GET /schedules/` - Mengambil jadwal keliling.
- `POST /schedules/` - Menambahkan jadwal baru oleh admin.
- `DELETE /schedules/{schedule_id}` - Menghapus jadwal oleh admin.
- `GET /schedules/unscheduled` - Mengambil daftar kelurahan yang belum memiliki jadwal.

## Role dan Hak Akses

| Role | Hak akses |
| --- | --- |
| `admin` | Melihat semua laporan, melihat prioritas dan kategori AI, mengatur jadwal, menyelesaikan laporan |
| `kelurahan` | Melihat dan mengubah status laporan sesuai kelurahan yang diberikan |
| Publik | Membuat laporan dan melihat data publik laporan |

## Status Laporan

| Status | Keterangan |
| --- | --- |
| `pending` | Laporan baru dan belum ditangani |
| `processed` | Laporan sedang diproses |
| `rejected` | Laporan ditolak |
| `solved` | Laporan sudah selesai ditangani |

## Prioritas Laporan

Prioritas dari layanan AI dipetakan menjadi:

| Label | Skor |
| --- | --- |
| `Tinggi` | 3 |
| `Sedang` | 2 |
| `Rendah` | 1 |
| `Unknown` | 0 |

Jika layanan AI tidak tersedia, laporan tetap tersimpan dengan prioritas `Unknown` dan kategori default `Lainnya`.

## Alur Development Lokal

1. Jalankan PostgreSQL.
2. Aktifkan virtual environment backend.
3. Jalankan migrasi database dengan `alembic upgrade head`.
4. Buat akun admin atau petugas jika belum ada.
5. Jalankan backend dengan `uvicorn backend.main:app --reload`.
6. Jalankan frontend dari folder `frontend/` dengan `npm run dev`.
7. Buka `http://localhost:3000`.

## Troubleshooting

### Backend gagal konek database

Periksa:

- PostgreSQL sudah berjalan.
- Database sudah dibuat.
- `DATABASE_URL` benar.
- Dependency `psycopg2` berhasil terinstal.

### Login gagal

Periksa:

- Akun sudah dibuat melalui script `create_admin` atau `create_user`.
- Password benar.
- `SECRET_KEY` dan `ALGORITHM` tersedia di `.env`.

### Frontend gagal mengambil data

Periksa:

- Backend berjalan di `http://localhost:8000`.
- `frontend/.env.local` berisi `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- CORS backend mengizinkan origin `http://localhost:3000`.

### Upload gambar gagal

Periksa:

- File yang diunggah adalah gambar.
- Folder `uploads/` dapat dibuat dan ditulis oleh proses backend.

## Catatan Integrasi AI

Endpoint AI yang digunakan backend diharapkan menerima request:

```json
{
  "teks": "Isi laporan warga"
}
```

Dan mengembalikan response dengan struktur utama:

```json
{
  "hasil_prediksi": {
    "prioritas": {
      "label": "Tinggi"
    },
    "kasus": {
      "kategori": "Tumpukan sampah"
    }
  }
}
```

Jika format response berbeda, bagian parsing di `backend/main.py` perlu disesuaikan.
