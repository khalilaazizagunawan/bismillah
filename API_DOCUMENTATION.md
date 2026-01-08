# 🍰 API Documentation - Toko Kue

## Overview

Sistem **Toko Kue** adalah microservice-based application untuk mengelola toko kue, termasuk:
- Produk kue yang dijual
- Stok bahan kue (inventory)
- Order dari customer
- Pembayaran
- **Integrasi dengan Toko Bahan Kue (Supplier)** untuk order bahan

---

## 🎯 Peran dalam Integrasi

```
┌─────────────────────┐                    ┌─────────────────────┐
│                     │                    │                     │
│     TOKO KUE        │  ───── ORDER ────> │   TOKO BAHAN KUE    │
│      (ANDA)         │                    │    (SUPPLIER)       │
│                     │ <── KIRIM BAHAN ── │   (Kelompok Lain)   │
│  Membuat kue:       │                    │                     │
│  - Brownies         │                    │  Menjual bahan:     │
│  - Cake             │                    │  - Tepung Terigu    │
│  - Kue Lapis        │                    │  - Gula Pasir       │
│                     │                    │  - Coklat           │
└─────────────────────┘                    └─────────────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          TOKO KUE (ANDA)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐    ┌─────────────────────────────────────┐    │
│   │   Frontend  │    │         GraphQL Gateway             │    │
│   │  (Port 3000)│◄──►│           (Port 4000)               │    │
│   └─────────────┘    └───────────────┬─────────────────────┘    │
│                                      │                           │
│   ┌──────────────────────────────────┼──────────────────────┐   │
│   │                                  ▼                      │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│   │  │ Product  │  │Inventory │  │  Order   │  │ Payment │ │   │
│   │  │  :4001   │  │  :4002   │  │  :4005   │  │  :4004  │ │   │
│   │  │ (Kue)    │  │ (Bahan)  │  │(Customer)│  │         │ │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│   │                                                         │   │
│   │  ┌──────────┐  ┌──────────────────────────────────────┐│   │
│   │  │Procure-  │  │      Integration Service             ││   │
│   │  │  ment    │  │          (Port 4006)                 ││   │
│   │  │  :4003   │  │                                      ││   │
│   │  └──────────┘  │  Menghubungkan ke Toko Bahan Kue     ││   │
│   │                │  (Kelompok Lain / Supplier)          ││   │
│   │                └───────────────┬──────────────────────┘│   │
│   └────────────────────────────────┼───────────────────────┘   │
│                                    │                            │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │     TOKO BAHAN KUE (SUPPLIER)   │
                    │        (Kelompok Lain)          │
                    │                                 │
                    │  Endpoint yang diakses:         │
                    │  - GET /api/catalog             │
                    │  - GET /api/inventory/check     │
                    │  - POST /api/external/orders    │
                    │  - POST /api/external/payments  │
                    └─────────────────────────────────┘
```

---

## 🔌 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React Admin Dashboard |
| GraphQL Gateway | 4000 | Apollo Server GraphQL API |
| Product Service | 4001 | Produk kue yang dijual |
| Inventory Service | 4002 | Stok bahan kue |
| Procurement Service | 4003 | Purchase Order internal |
| Payment Service | 4004 | Pembayaran |
| Order Service | 4005 | Order dari customer |
| **Integration Service** | **4006** | **Integrasi dengan Supplier** |

---

## 📊 Flow Integrasi dengan Toko Bahan Kue

```
┌─────────────────┐                           ┌─────────────────┐
│    TOKO KUE     │                           │  TOKO BAHAN KUE │
│     (Anda)      │                           │   (Supplier)    │
└────────┬────────┘                           └────────┬────────┘
         │                                             │
         │  1️⃣ Lihat katalog bahan                     │
         │──────────────────────────────────────────────>
         │                                             │
         │  2️⃣ Response: Tepung, Gula, Coklat          │
         │<──────────────────────────────────────────────
         │                                             │
         │  3️⃣ Order: "Saya mau Tepung 10kg"           │
         │──────────────────────────────────────────────>
         │                                             │
         │  4️⃣ Response: Invoice INV-001, Total 150rb  │
         │<──────────────────────────────────────────────
         │                                             │
         │  5️⃣ Bayar invoice                           │
         │──────────────────────────────────────────────>
         │                                             │
         │  6️⃣ Supplier kirim barang                   │
         │<──────────────────────────────────────────────
         │                                             │
         │  7️⃣ Konfirmasi barang diterima              │
         │  (Update inventory lokal)                   │
         │                                             │
```

---

## 🌐 GraphQL Endpoint

**URL:** `http://localhost:4000/graphql`

---

## 🔗 Endpoint Integrasi (Integration Service)

### REST Endpoints untuk memanggil Supplier

#### 1. Lihat Katalog dari Supplier

```http
GET http://localhost:4006/api/supplier/catalog
```

**Response:**
```json
{
  "success": true,
  "message": "Katalog dari Toko Bahan Kue (Supplier)",
  "data": [
    { "id": 1, "name": "Tepung Terigu", "stock": 100, "unit": "kg" },
    { "id": 2, "name": "Gula Pasir", "stock": 50, "unit": "kg" }
  ]
}
```

---

#### 2. Cek Stok dari Supplier

```http
GET http://localhost:4006/api/supplier/inventory
```

---

#### 3. Order Bahan ke Supplier

```http
POST http://localhost:4006/api/supplier/orders
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    { "name": "Tepung Terigu", "qty": 10, "unit": "kg", "price": 15000 },
    { "name": "Gula Pasir", "qty": 5, "unit": "kg", "price": 12000 }
  ],
  "notes": "Kirim segera"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order berhasil dikirim ke Toko Bahan Kue",
  "data": {
    "id": 1,
    "items": [...],
    "totalAmount": 210000,
    "status": "PENDING",
    "supplierInvoice": "INV-202512-0001",
    "createdAt": "2025-12-26T10:00:00.000Z"
  }
}
```

---

#### 4. Bayar ke Supplier

```http
POST http://localhost:4006/api/supplier/payments
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": 1,
  "invoiceNumber": "INV-202512-0001",
  "amount": 210000,
  "paymentMethod": "Transfer Bank"
}
```

---

#### 5. Konfirmasi Barang Diterima

```http
POST http://localhost:4006/api/supplier/orders/1/receive
Content-Type: application/json
```

**Request Body:**
```json
{
  "notes": "Barang lengkap, kondisi baik"
}
```

> ⚡ **Note:** Ketika konfirmasi barang diterima, stok akan otomatis ditambahkan ke inventory lokal!

---

### Webhook Endpoints (Diterima dari Supplier)

Endpoint ini dipanggil oleh Supplier untuk mengirim notifikasi:

#### Menerima Invoice

```http
POST http://localhost:4006/api/webhook/invoice
```

#### Menerima Notifikasi Pengiriman

```http
POST http://localhost:4006/api/webhook/shipment
```

---

## 📝 GraphQL Queries & Mutations

### Queries Integrasi

```graphql
# Lihat katalog dari Supplier
query {
  supplierCatalog {
    success
    message
    data {
      id
      name
      stock
      unit
      price
    }
  }
}

# Cek stok dari Supplier
query {
  supplierInventory {
    success
    message
    data {
      id
      name
      stock
      unit
    }
  }
}

# List order ke Supplier
query {
  supplierOrders {
    id
    items
    totalAmount
    status
    supplierInvoice
    paidAt
    receivedAt
    createdAt
  }
}

# Invoice yang diterima
query {
  receivedInvoices {
    id
    invoiceNumber
    amount
    status
    dueDate
  }
}

# Log integrasi
query {
  integrationLogs {
    id
    direction
    endpoint
    method
    statusCode
    createdAt
  }
}
```

### Mutations Integrasi

```graphql
# Order bahan ke Supplier
mutation {
  orderFromSupplier(
    items: [
      { name: "Tepung Terigu", qty: 10, unit: "kg", price: 15000 }
      { name: "Gula Pasir", qty: 5, unit: "kg", price: 12000 }
    ]
    notes: "Kirim segera"
  ) {
    success
    message
    data {
      id
      totalAmount
      supplierInvoice
    }
  }
}

# Bayar ke Supplier
mutation {
  paySupplier(
    orderId: "1"
    invoiceNumber: "INV-202512-0001"
    amount: 210000
    paymentMethod: "Transfer Bank"
  ) {
    success
    message
  }
}

# Konfirmasi barang diterima (otomatis update inventory)
mutation {
  receiveFromSupplier(id: "1", notes: "Barang lengkap") {
    success
    message
    data {
      id
      status
      receivedAt
    }
  }
}
```

---

## ⚙️ Konfigurasi

### Environment Variables

Tambahkan di `docker-compose.yml` atau `.env`:

```yaml
# URL API Toko Bahan Kue (Supplier)
SUPPLIER_API_URL: http://[IP_KELOMPOK_LAIN]:5000

# Nama toko Anda
STORE_NAME: Toko Kue Makmur
```

---

## 🚀 Quick Start

### 1. Set URL Supplier

Edit `docker-compose.yml`:

```yaml
integration:
  environment:
    SUPPLIER_API_URL: http://192.168.1.100:5000  # Ganti dengan IP kelompok lain
```

### 2. Jalankan semua service:

```bash
docker-compose up --build
```

### 3. Test integrasi:

```bash
# Lihat katalog dari supplier
curl http://localhost:4006/api/supplier/catalog
```

---

## 📋 Order Status Flow

```
PENDING → PAID → SHIPPED → RECEIVED
```

| Status | Description |
|--------|-------------|
| PENDING | Order baru, menunggu pembayaran |
| PAID | Sudah bayar, menunggu pengiriman |
| SHIPPED | Barang sedang dikirim oleh supplier |
| RECEIVED | Barang diterima, stok inventory updated |

---

## 📞 Integrasi dengan Kelompok Lain

### Yang Anda Perlu dari Kelompok Lain (Toko Bahan Kue):

1. **URL API mereka**: `http://[IP_MEREKA]:PORT`
2. **Endpoint yang tersedia**:
   - `GET /api/catalog` - Katalog bahan
   - `GET /api/inventory/check` - Cek stok
   - `POST /api/external/orders` - Buat order
   - `POST /api/external/payments` - Konfirmasi bayar

### Yang Kelompok Lain Bisa Akses dari Anda:

Jika diperlukan, Anda bisa membuka webhook endpoint untuk menerima notifikasi:
- `POST /api/webhook/invoice` - Menerima tagihan
- `POST /api/webhook/shipment` - Menerima notifikasi pengiriman
