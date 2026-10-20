# PoluSee Web Platform (SKPL-1000 Revisi C)

**PoluSee** adalah platform berbasis website pemantau dan penghimbau kualitas udara real-time berbasis lokasi yang dibangun mengacu penuh pada dokumen **Spesifikasi Kebutuhan Perangkat Lunak (SKPL-1000 Revisi C)** tanpa mengubah desain visual, tipografi, tata letak, maupun warna asli aplikasi.

## 1. Spesifikasi Arsitektur Sistem (Website)

| Komponen Arsitektur | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Bahasa Pemrograman** | **JavaScript (ES6+)** | Digunakan secara full-stack di sisi klien (Frontend) dan server (Backend Node.js) |
| **Frontend Framework** | **Vue.js 3 (Vite)** | Single Page Application (SPA) modular berbasis fitur (`src/features/*`) |
| **Backend Framework** | **Express.js** | RESTful API modular (`backend/src/modules/*`) dengan otorisasi JWT (`USER` & `ADMIN`) |
| **Database** | **PostgreSQL** | 9 tabel relasional sesuai Class Diagram Bab 3.2.3 & Lampiran B SKPL (`database/schema.sql`) |
| **Layanan Peta (Map)** | **OpenStreetMap API** | Leaflet + OpenStreetMap Tile Server + OpenStreetMap Nominatim Geocoding/Reverse Geocoding API |

## 2. Struktur Folder Modular / Berfitur

```text
PoluSee/
├── index.html                                  # Entry HTML bersih (tanpa tag Figma) + OpenStreetMap Leaflet
├── package.json                                # Dependensi & script Frontend Vue.js + Vite
├── vite.config.js / vite.config.ts             # Konfigurasi Vite bersih dari plugin Figma + Proxy /api
├── .env.example                                # Template konfigurasi API Eksternal (Frontend)
├── public/
│   └── favicon.svg                             # Ikon aplikasi PoluSee
├── src/                                        # FRONTEND VUE.JS (MODULAR PER FITUR)
│   ├── main.js                                 # Entrypoint Vue.js (JavaScript)
│   ├── App.vue                                 # Shell utama aplikasi (Sidebar, Topbar, Workspace, Footer)
│   ├── styles/
│   │   └── index.css                           # Seluruh desain CSS asli + layer OpenStreetMap
│   ├── config/
│   │   └── externalApi.js                      # Pusat konfigurasi & dokumentasi API Eksternal
│   ├── services/
│   │   ├── apiClient.js                        # HTTP Client + JWT Bearer Token ke Express.js
│   │   ├── aqiService.js                       # Integrasi API AQI Eksternal (WAQI/OpenWeather) & Backend
│   │   └── osmMapService.js                    # Integrasi OpenStreetMap Nominatim API & HTML5 Geolocation
│   ├── components/common/
│   │   ├── AppIcon.vue                         # Komponen ikon SVG utama
│   │   ├── WeatherIcon.vue                     # Komponen ikon cuaca
│   │   ├── HealthIcon.vue                      # Komponen ikon panduan kesehatan
│   │   └── OpenStreetMapCanvas.vue             # Komponen Peta Interaktif OpenStreetMap (Leaflet)
│   └── features/
│       ├── auth/                               # FR-01 (Login) & FR-02 (Registrasi)
│       │   ├── AuthPage.vue
│       │   └── authStore.js
│       ├── aqi/                                # FR-03 (Tampil AQI Real-time & Rincian Polutan)
│       │   ├── AqiRealtimeCard.vue
│       │   ├── AirQualityDetail.vue
│       │   └── aqiData.js
│       ├── history/                            # FR-04 (View Grafik dan Riwayat AQI)
│       │   ├── HistorySummaryCard.vue
│       │   └── HistoryDetail.vue
│       ├── map/                                # Peta Titik Pantau OpenStreetMap API
│       │   ├── HomeMapCard.vue
│       │   ├── MapDetail.vue
│       │   └── stationsData.js
│       ├── health/                             # FR-05 (Lihat Rekomendasi Kesehatan)
│       │   ├── HomeHealthCard.vue
│       │   └── HealthRecommendations.vue
│       ├── education/                          # FR-06 (View & Ulas Edukasi) & FR-07 (Edit Konten Ulasan)
│       │   ├── HomeEducationSection.vue
│       │   ├── ArticleQuickModal.vue
│       │   ├── EducationPage.vue
│       │   └── educationData.js
│       ├── community/                          # FR-08 (Akses Komunitas), FR-09 (Lapor Polusi), FR-10 (Lihat Konten)
│       │   ├── CommunityFeed.vue
│       │   ├── ReportDialog.vue
│       │   └── communityData.js
│       ├── profile/                            # FR-11 (Kelola Profil)
│       │   └── ProfileView.vue
│       └── admin/                              # FR-12 (Monitor AQI), FR-13 (Kelola Rekomendasi),
│           └── AdminApp.vue                    # FR-14 (Moderasi Komunitas), FR-15 (Kelola Edukasi)
├── backend/                                    # BACKEND EXPRESS.JS (MODULAR PER FITUR)
│   ├── package.json                            # Dependensi Express, pg, bcryptjs, jsonwebtoken, cors
│   ├── .env.example                            # Template konfigurasi PostgreSQL & API Eksternal (Backend)
│   ├── server.js                               # Entrypoint Express.js REST API (Port 5000)
│   └── src/
│       ├── config/
│       │   ├── db.js                           # Connection Pool PostgreSQL (pg.Pool)
│       │   └── externalApi.js                  # Konfigurasi API Eksternal di sisi server
│       ├── middleware/
│       │   └── authMiddleware.js               # Proteksi JWT & Role-Based Access Control (USER / ADMIN)
│       └── modules/
│           ├── auth/                           # POST /api/auth/login & POST /api/auth/register
│           ├── aqi/                            # GET /api/aqi/realtime & GET /api/aqi/history
│           ├── rekomendasi/                    # GET /api/rekomendasi/current (Rule-Based Engine)
│           ├── edukasi/                        # GET/POST /api/edukasi & PUT /api/edukasi/ulasan/:id
│           ├── komunitas/                      # GET /api/komunitas/feed & POST /api/komunitas/lapor
│           ├── profil/                         # GET/PUT /api/profile
│           └── admin/                          # /api/admin/aqi-monitor, /rekomendasi, /moderasi, /edukasi
└── database/                                   # DATABASE POSTGRESQL
    ├── schema.sql                              # DDL 9 Tabel sesuai Class Diagram & Lampiran B SKPL-1000
    └── seed.sql                                # Data awal (User, Admin, AQI 4 Kota, Rekomendasi, Edukasi, Laporan)
```

## 3. Panduan Bagian yang Perlu API Eksternal & Command Memasukkannya

Berikut adalah daftar bagian yang terhubung dengan **API Eksternal**, lokasi file tempat memasukkannya, serta command terminal untuk mengaktifkannya:

| Layanan API Eksternal | Fungsi pada PoluSee | Lokasi File untuk Memasukkan API Key / URL | Command Konfigurasi & Uji Coba |
| :--- | :--- | :--- | :--- |
| **1. OpenStreetMap API (Tile Server & Nominatim Geocoding)** | Merender peta interaktif pada Beranda (`HomeMapCard.vue`), Detail Stasiun (`MapDetail.vue`), dan Reverse Geocoding titik laporan polusi (`ReportDialog.vue`) | 1. `.env` (`VITE_OSM_TILE_URL`, `VITE_OSM_NOMINATIM_BASE_URL`)<br>2. `src/config/externalApi.js` (Bagian `OPENSTREETMAP`)<br>3. `src/components/common/OpenStreetMapCanvas.vue`<br>4. `src/services/osmMapService.js` | **Aktif otomatis tanpa API Key berbayar.**<br>Uji coba Reverse Geocoding di terminal:<br>`curl -A "PoluSee/2.0" "https://nominatim.openstreetmap.org/reverse?format=json&lat=-0.5022&lon=117.1536"` |
| **2. WAQI / AQICN API (Data AQI Real-time Eksternal)** | Mengambil indeks AQI real-time, PM2.5, dan PM10 berdasarkan koordinat kota (FR-03 & FR-12 SKPL) | 1. `.env` (`VITE_ENABLE_EXTERNAL_AQI_API=true` & `VITE_AQICN_API_TOKEN=...`)<br>2. `backend/.env` (`ENABLE_EXTERNAL_AQI_API=true` & `AQICN_API_TOKEN=...`)<br>3. `src/config/externalApi.js` (Bagian `AQICN`)<br>4. `src/services/aqiService.js` (`fetchRealtimeAqiFromExternal`)<br>5. `backend/src/modules/aqi/aqi.controller.js` | Buat file `.env` lalu masukkan token dari `https://aqicn.org/data-platform/token/`:<br>`cp .env.example .env`<br>Uji coba di terminal:<br>`curl "https://api.waqi.info/feed/geo:-0.5022;117.1536/?token=TOKEN_ANDA"` |
| **3. OpenWeatherMap Air Pollution API** | Mengambil konsentrasi polutan (`PM2.5`, `PM10`, `O3`, `NO2`, `SO2`, `CO`) secara real-time (FR-03) | 1. `.env` (`VITE_ENABLE_OPENWEATHER_API=true` & `VITE_OPENWEATHER_API_KEY=...`)<br>2. `src/config/externalApi.js` (Bagian `OPENWEATHER`)<br>3. `src/services/aqiService.js` | Masukkan API key di `.env`, lalu uji di terminal:<br>`curl "https://api.openweathermap.org/data/2.5/air_pollution?lat=-0.5022&lon=117.1536&appid=API_KEY_ANDA"` |
| **4. HTML5 Browser Geolocation API** | Mendeteksi koordinat GPS perangkat pengguna secara otomatis (UC-03 & UC-09) | `src/services/osmMapService.js` (`detectUserLocationViaOpenStreetMap`) & `src/features/community/ReportDialog.vue` | Berjalan langsung melalui `navigator.geolocation.getCurrentPosition` pada browser modern (HTTPS / `localhost`). |

## 4. Command Instalasi & Menjalankan Project

### A. Menjalankan Frontend (Vue.js + Vite)
```bash
# 1. Salin file konfigurasi environment frontend
cp .env.example .env

# 2. Instal dependensi frontend
npm install

# 3. Jalankan development server (http://localhost:5173)
npm run dev
```

### B. Menyiapkan Database PostgreSQL
```bash
# 1. Buat database PostgreSQL bernama polusee_db
psql -U postgres -c "CREATE DATABASE polusee_db;"

# 2. Jalankan skema 9 tabel & data awal (seeder) sesuai SKPL-1000
npm run db:init
# atau secara manual:
psql -U postgres -d polusee_db -f database/schema.sql
psql -U postgres -d polusee_db -f database/seed.sql
```

### C. Menjalankan Backend (Express.js)
```bash
# 1. Masuk ke direktori backend & salin file environment
cd backend
cp .env.example .env

# 2. Sesuaikan DB_USER dan DB_PASSWORD PostgreSQL Anda di dalam file backend/.env

# 3. Instal dependensi backend & jalankan server (http://localhost:5000)
npm install
npm run start
```
