# Energy Monitoring Ravelware - Backend API

Sistem monitoring energy untuk dashboard Ravelware yang menampilkan data real-time dari power meter melalui protokol MQTT dan menyimpan data ke InfluxDB v3 Core.

## 📋 Deskripsi

Energy monitoring adalah dashboard untuk menampilkan data-data power meter antara lain:
- **Energy (kWh)** - Konsumsi energi
- **Power (kW)** - Daya listrik
- **Arus (Ampere)** - Arus listrik
- **Voltage (Volt)** - Tegangan listrik

Ada 3 panel listrik di kantor Ravelware (1 panel per lantai). Dashboard digunakan untuk monitoring realtime penggunaan energy listrik dan biaya per panel atau total gedung.

## 🏗️ Teknologi

- **Backend**: Express.js (Node.js)
- **Database**: InfluxDB v3 Core
- **Protocol**: MQTT (untuk menerima data dari sensor)
- **Format Data**: JSON

## 📦 Instalasi

1. **Clone atau extract project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   
   Edit file `.env` dengan konfigurasi InfluxDB Anda:
   ```env
   INFLUX_HOST=http://localhost:8181
   INFLUX_TOKEN=your_influxdb_token_here
   INFLUX_DATABASE=energy_monitoring
   
   MQTT_BROKER=mqtt://test.mosquitto.org
   PORT=3000
   ```

4. **Pastikan InfluxDB v3 Core sudah running**
   - Default port: `8181`
   - Buat database: `energy_monitoring`
   - Generate API Token dari InfluxDB UI

## 🚀 Cara Menjalankan

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📡 Data dari MQTT

### Topic MQTT
- `DATA/PM/PANEL_LANTAI_1`
- `DATA/PM/PANEL_LANTAI_2`
- `DATA/PM/PANEL_LANTAI_3`

### Format Payload MQTT
```json
{
  "status": "OK",
  "message": "",
  "data": {
    "pmCode": "PANEL_LANTAI_1",
    "v": [224.7, 224.7, 0, 149.8],
    "i": [0, 0.2, 0.02, 0.07],
    "kw": "0.34",
    "kwh": "0.20",
    "kVA": "0.18",
    "pf": 0,
    "vunbal": 0.009,
    "iunbal": 0.099,
    "time": "2023-07-01 12:30:05"
  }
}
```

## 🔌 REST API Endpoints

### 1. Health Check
```
GET /api
```
Cek status API

**Response:**
```json
{
  "status": "OK",
  "message": "Energy Monitoring Ravelware API 🚀",
  "timestamp": "2023-07-01T12:30:05.000Z"
}
```

### 2. MQTT Status
```
GET /api/mqtt/status
```
Cek status koneksi MQTT broker

**Response:**
```json
{
  "status": "OK",
  "data": {
    "connected": true,
    "broker": "mqtt://test.mosquitto.org",
    "topics": [
      "DATA/PM/PANEL_LANTAI_1",
      "DATA/PM/PANEL_LANTAI_2",
      "DATA/PM/PANEL_LANTAI_3"
    ]
  }
}
```

### 3. Realtime Data
```
GET /api/realtime
```
Mendapatkan data realtime dari semua panel (data 5 menit terakhir)

**Response:**
```json
{
  "status": "OK",
  "message": "",
  "data": [
    {
      "pmCode": "PANEL_LANTAI_1",
      "realtime": {
        "voltage": 224.7,
        "current": 0.2,
        "power": 0.34,
        "energy": 132.1
      },
      "todayUsage": 32.1,
      "cost": 48150,
      "status": "ONLINE",
      "lastUpdate": "2023-07-01T12:30:05.000Z"
    }
  ]
}
```

### 4. Today Usage
```
GET /api/today/:panel
```
Mendapatkan penggunaan hari ini untuk panel tertentu

**Example:**
```
GET /api/today/PANEL_LANTAI_1
```

**Response:**
```json
{
  "status": "OK",
  "message": "",
  "data": {
    "panel": "PANEL_LANTAI_1",
    "startKwh": 100.0,
    "currentKwh": 132.1,
    "todayUsage": 32.1,
    "cost": 48150
  }
}
```

### 5. Historical Data
```
GET /api/history?panel=PANEL_LANTAI_1&start=2023-07-01T00:00:00Z&end=2023-07-01T23:59:59Z
```
Mendapatkan data historis untuk panel tertentu

**Query Parameters:**
- `panel` (required): Nama panel (e.g., PANEL_LANTAI_1)
- `start` (required): Waktu mulai (ISO 8601 format)
- `end` (required): Waktu akhir (ISO 8601 format)

**Response:**
```json
{
  "status": "OK",
  "message": "",
  "data": {
    "pmCode": "PANEL_LANTAI_1",
    "period": {
      "start": "2023-07-01T00:00:00Z",
      "end": "2023-07-01T23:59:59Z"
    },
    "records": [
      {
        "time": "2023-07-01T00:00:00Z",
        "voltage": { "v_0": 224.7, "v_1": 224.7, "v_2": 0, "v_3": 149.8 },
        "current": { "i_0": 0, "i_1": 0.2, "i_2": 0.02, "i_3": 0.07 },
        "kW": 0.34,
        "kWh": 100.0,
        "kVA": 0.18,
        "pf": 0
      }
    ]
  }
}
```

### 6. Daily Statistics
```
GET /api/stats/daily?panel=PANEL_LANTAI_1&start=2023-07-01&end=2023-07-31
```
Mendapatkan statistik harian untuk panel tertentu

**Query Parameters:**
- `panel` (required): Nama panel
- `start` (required): Tanggal mulai (YYYY-MM-DD)
- `end` (required): Tanggal akhir (YYYY-MM-DD)

**Response:**
```json
{
  "status": "OK",
  "message": "",
  "data": {
    "pmCode": "PANEL_LANTAI_1",
    "period": {
      "start": "2023-07-01",
      "end": "2023-07-31"
    },
    "daily_stats": [
      {
        "date": "2023-07-01",
        "energy_kwh": 32.1
      }
    ]
  }
}
```

### 7. Yearly Statistics
```
GET /api/stats/yearly?year=2023
```
Mendapatkan statistik tahunan (agregasi bulanan) untuk semua panel

**Query Parameters:**
- `year` (required): Tahun (YYYY)

**Response:**
```json
{
  "status": "OK",
  "message": "",
  "data": {
    "year": "2023",
    "monthly_stats": [
      {
        "month": "2023-01",
        "panel": "PANEL_LANTAI_1",
        "energy_kwh": 450.5
      }
    ]
  }
}
```

### 8. Test Publish (Testing Only)
```
POST /api/test/publish
```
Publish data test ke MQTT broker untuk testing

**Request Body:**
```json
{
  "panel": "PANEL_LANTAI_1",
  "data": {
    "v": [224.7, 224.7, 0, 149.8],
    "i": [0, 0.2, 0.02, 0.07],
    "kw": "0.34",
    "kwh": "132.1",
    "kVA": "0.18",
    "pf": 0,
    "time": "2023-07-01 12:30:05"
  }
}
```

**Response:**
```json
{
  "status": "OK",
  "message": "Test data published successfully to MQTT topic"
}
```

## 💾 Struktur Database InfluxDB

### Measurement
- `energy_data`

### Tags
- `pmCode` - Kode panel (PANEL_LANTAI_1, PANEL_LANTAI_2, PANEL_LANTAI_3)

### Fields
- `i_0`, `i_1`, `i_2`, `i_3` - Arus (Ampere) pada 4 phase
- `v_0`, `v_1`, `v_2`, `v_3` - Tegangan (Volt) pada 4 phase
- `kW` - Daya (kilowatt)
- `kWh` - Energi (kilowatt-hour)
- `kVA` - Daya semu (kilovolt-ampere)
- `pf` - Power factor

### Timestamp
- Automatic timestamp dari InfluxDB

## 📁 Struktur Project

```
Backend Intern Test/
├── config/
│   └── config.js              # Konfigurasi environment
├── services/
│   ├── influxdb.service.js    # Service untuk InfluxDB operations
│   └── mqtt.service.js        # Service untuk MQTT client
├── routes/
│   ├── index.routes.js        # Root routes
│   └── api.routes.js          # API routes
├── app.js                     # Main application file
├── package.json               # Dependencies
├── .env                       # Environment variables (jangan commit!)
└── README.md                  # Dokumentasi
```

## 🔧 Konfigurasi InfluxDB v3

### Cara Mendapatkan Token InfluxDB:

1. Buka InfluxDB UI di browser: `http://localhost:8181`
2. Login dengan credentials Anda
3. Pergi ke **Data** → **API Tokens** atau **Load Data** → **API Tokens**
4. Klik **Generate API Token** → **All Access API Token** (untuk development)
5. Copy token tersebut dan paste ke file `.env`

### Atau via CLI:
```bash
influx auth create --all-access
```

## 📊 Cara Menghitung Biaya

Berdasarkan spesifikasi:
- Tarif listrik: **Rp 1.500 per kWh**
- Biaya = Today's Usage (kWh) × 1.500

Contoh:
- Jika today's usage = 32,1 kWh
- Maka biaya = 32,1 × 1.500 = **Rp 48.150**

## 🧪 Testing

### Test dengan cURL:

1. **Health Check**
   ```bash
   curl http://localhost:3000/api
   ```

2. **Realtime Data**
   ```bash
   curl http://localhost:3000/api/realtime
   ```

3. **Publish Test Data**
   ```bash
   curl -X POST http://localhost:3000/api/test/publish \
     -H "Content-Type: application/json" \
     -d '{
       "panel": "PANEL_LANTAI_1",
       "data": {
         "v": [224.7, 224.7, 0, 149.8],
         "i": [0, 0.2, 0.02, 0.07],
         "kw": "0.34",
         "kwh": "132.1",
         "kVA": "0.18",
         "pf": 0
       }
     }'
   ```

## 🐛 Troubleshooting

### InfluxDB Connection Error
- Pastikan InfluxDB v3 Core sudah running
- Cek apakah `INFLUX_HOST` dan `INFLUX_TOKEN` di `.env` sudah benar
- Cek apakah database `energy_monitoring` sudah dibuat

### MQTT Connection Error
- Pastikan MQTT broker dapat diakses
- Untuk testing, gunakan public broker: `mqtt://test.mosquitto.org`
- Atau gunakan broker lokal dengan Mosquitto

### No Data in Response
- Pastikan MQTT client sudah menerima data dari sensor
- Cek log di console apakah ada data yang masuk
- Gunakan endpoint `/api/test/publish` untuk publish data test

## 📝 License

ISC

## 👤 Contact

PT Ravelware Technology Indonesia
- Telp: 021-82699297
- Email: contact@ravelware.co
