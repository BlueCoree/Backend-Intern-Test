**Energy Monitoring API**

Dokumentasi API sederhana untuk memonitor penggunaan listrik di 3 lantai.
1. Koneksi MQTT

Data dikirim oleh sensor (Power Meter) ke Broker.

    Broker: mqtt://test.mosquitto.org

    Topic: DATA/PM/PANEL_LANTAI_1 (Ganti angka 1 untuk lantai lain)

Format Pesan :
JSON

```
{
  "pmCode": "PANEL_LANTAI_1",
  "v": [220.5, 221.0, 219.8],
  "i": [1.5, 2.0, 1.8],
  "kw": 0.45,
  "kwh": 112.5
}
```

2. REST API 

A. Cek Data Real-time

Digunakan dashboard untuk melihat kondisi listrik saat ini di semua lantai.

    Endpoint: GET /api/realtime

Hasil (Response):
JSON

```
{
  "status": "Success",
  "data": [
    {
      "pmCode": "PANEL_LANTAI_1",
      "voltage": 220.5,
      "current": 1.5,
      "power_kw": 0.45,
      "energy_kwh": 112.5,
      "todayUsage": 12.5,
      "cost": 18750,
      "status": "ONLINE"
    }
  ]
}
```

B. Cek Pemakaian Hari Ini

Melihat rincian biaya dan pemakaian khusus untuk satu lantai tertentu.

    Endpoint: GET /api/today/:panel

    Contoh: /api/today/PANEL_LANTAI_1

Hasil (Response):
JSON

```
{
  "panel": "PANEL_LANTAI_1",
  "usage_kwh": 12.5,
  "total_cost": 18750,
  "last_update": "2026-01-30T01:10:40Z"
}
```

C. Statistik Tahunan

Melihat pemakaian energy per bulan dalam 1 tahun untuk semua panel.

    Endpoint: GET /api/stats/yearly

    Parameter: year (opsional, default tahun sekarang)

    Contoh: /api/stats/yearly?year=2023

Hasil (Response):
JSON

```
{
  "status": "Success",
  "data": {
    "year": "2023",
    "monthly_stats": [
      {
        "month": "2023-01",
        "panel": "PANEL_LANTAI_1",
        "energy_kwh": "450.50"
      },
      {
        "month": "2023-01",
        "panel": "PANEL_LANTAI_2",
        "energy_kwh": "380.25"
      }
    ]
  }
}
```

3. Penyimpanan (InfluxDB)

Data disimpan di InfluxDB v3 pada database energy_monitoring.

    Measurement: energy_monitoring

    Tag: pmCode

    Fields: v_0, i_0, kW, kWh

4. Rumus Biaya

Biaya dihitung otomatis oleh sistem dengan aturan:

    Biaya = (kWh Sekarang - kWh Awal Hari) × Rp 1.500


5. Penanganan Error (Error Handling)

Error yang bisa terjadi saat pakai API ini:

A. Error 400 - Bad Request

Terjadi kalau format data yang dikirim salah.

Contoh 1: Tahun bukan angka
    
Request: GET /api/stats/yearly?year=abcd

```
{
    "status": "Error",
    "message": "Format tahun tidak valid"
}
```

Contoh 2: Tahun terlalu kecil atau besar
    
Request: GET /api/stats/yearly?year=1999

```    
{
    "status": "Error",
    "message": "Format tahun tidak valid"
}
```

B. Error 404 - Not Found

Terjadi kalau data yang dicari tidak ada.

Contoh: Panel tidak ditemukan atau tidak ada data
    
Request: GET /api/today/PANEL_LANTAI_99

```
{
    "status": "Error",
    "message": "Panel PANEL_LANTAI_99 tidak ditemukan atau tidak ada data"
}
```

C. Error 500 - Internal Server Error

Terjadi kalau ada masalah di server atau database.

Contoh: Database tidak bisa diakses
    
```
{
    "status": "Error",
    "message": "Gagal terhubung ke Database"
}
```