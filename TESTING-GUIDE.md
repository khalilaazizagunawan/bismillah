# Panduan Testing Integrasi Tellyou ↔ Toko Kue

## 📋 Daftar Isi
1. [Testing: Toko Kue → Tellyou (Order Bahan)](#1-toko-kue--tellyou)
2. [Testing: Tellyou → Toko Kue (Update Inventory)](#2-tellyou--toko-kue-update-inventory)
3. [Testing: Tellyou → Toko Kue (Kirim Tagihan)](#3-tellyou--toko-kue-kirim-tagihan)

---

## 1. Toko Kue → Tellyou (Order Bahan)

### Skenario
Toko Kue memesan bahan dari Tellyou melalui GraphQL.

### Cara Testing

#### A. Via Apollo Sandbox (Recommended)
1. Buka: `http://localhost:4000/graphql`
2. Jalankan mutation ini:

```graphql
mutation PesanKeTellyou {
  createOrderToTellyou(
    externalOrderId: "ORDER-TK-001"
    totalAmount: 150000
    items: [
      { id: "1", qty: 5, price: 25000 },
      { id: "2", qty: 2, price: 12500 }
    ]
  ) {
    success
    transaction_id
    order_id
    total_cost
    payment_status
    message
  }
}
```

#### B. Via Postman/cURL
```bash
curl -X POST http://localhost:4006/api/tellyou/order \
  -H "Content-Type: application/json" \
  -d '{
    "externalOrderId": "ORDER-TK-002",
    "totalAmount": 200000,
    "items": [
      {"id": "1", "qty": 3, "price": 50000},
      {"id": "2", "qty": 2, "price": 25000}
    ]
  }'
```

### Verifikasi Berhasil
1. **Cek Response**: Harus ada `transaction_id` dari Tellyou
2. **Cek Database Tellyou**:
```bash
docker exec -it stock-payment-db psql -U postgres -d stock_payment_db
SELECT * FROM transactions WHERE source_system = 'TOKO_KUE_GATEWAY' ORDER BY created_at DESC LIMIT 3;
\q
```

3. **Cek Log Tellyou**:
```bash
docker logs stock-payment-service --tail 20
```
Harus ada log: `✅ Transaction created: TXN-...`

---

## 2. Tellyou → Toko Kue (Update Inventory)

### Skenario
Tellyou memberitahu Toko Kue bahwa stok bahan tertentu telah berubah (misal: restok atau koreksi).

### Cara Testing

#### Via Postman/cURL (Simulasi dari Tellyou)
```bash
curl -X POST http://localhost:4006/api/webhook/inventory-update \
  -H "Content-Type: application/json" \
  -d '{
    "source": "TELLYOU_SYSTEM",
    "notes": "Restok bahan dari Tellyou",
    "items": [
      {
        "name": "Tepung Terigu",
        "quantityChange": 50,
        "unit": "kg"
      },
      {
        "name": "Gula Pasir",
        "quantityChange": -10,
        "unit": "kg"
      }
    ]
  }'
```

### Verifikasi Berhasil
1. **Cek Response**: Harus ada `results` dengan action `UPDATED` atau `CREATED`
2. **Cek Inventory Toko Kue**:
   - Buka: `http://localhost:5173` (Frontend Toko Kue)
   - Masuk ke halaman **Inventory**
   - Cek apakah stok "Tepung Terigu" bertambah 50 kg

3. **Cek via GraphQL**:
```graphql
query {
  inventories {
    id
    name
    stock
    unit
  }
}
```
Di `http://localhost:4000/graphql`

4. **Cek Log Integration Service**:
```bash
docker logs toko-kue-mergedfixfe-integration-1 --tail 30
```
Harus ada log: `✅ Updated inventory: Tepung Terigu (...)`

---

## 3. Tellyou → Toko Kue (Kirim Tagihan)

### Skenario
Setelah Toko Kue pesan bahan, Tellyou mengirim tagihan/invoice yang otomatis masuk ke Payment Service Toko Kue.

### Cara Testing

#### Via Postman/cURL (Simulasi dari Tellyou)
```bash
curl -X POST http://localhost:4006/api/webhook/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-TELLYOU-001",
    "supplierName": "Tellyou Supplier",
    "orderId": "ORDER-TK-001",
    "amount": 150000,
    "dueDate": "2026-01-15",
    "items": [
      {
        "name": "Tepung Terigu Premium",
        "qty": 5,
        "unit": "kg",
        "price": 25000
      },
      {
        "name": "Gula Pasir Halus",
        "qty": 2,
        "unit": "kg",
        "price": 12500
      }
    ]
  }'
```

### Verifikasi Berhasil
1. **Cek Response**: 
```json
{
  "success": true,
  "message": "Invoice diterima dan tagihan telah dibuat"
}
```

2. **Cek Payment Service Toko Kue**:
   - Buka: `http://localhost:5173` (Frontend Toko Kue)
   - Masuk ke halaman **Payment/Tagihan**
   - Harus ada tagihan baru dengan invoice `INV-TELLYOU-001`

3. **Cek via GraphQL**:
```graphql
query {
  payments {
    id
    invoiceNumber
    supplierName
    amount
    status
    dueDate
  }
}
```
Di `http://localhost:4000/graphql`

4. **Cek Database Toko Kue**:
```bash
docker exec -it toko_kue_postgres psql -U toko_user -d payment_db
SELECT * FROM payments WHERE invoice_number = 'INV-TELLYOU-001';
\q
```

5. **Cek Log**:
```bash
docker logs toko-kue-mergedfixfe-integration-1 --tail 20
```
Harus ada: `✅ Tagihan INV-TELLYOU-001 berhasil dikirim ke Payment Service`

---

## 🔍 Troubleshooting

### Error: "ENOTFOUND stock-payment-service"
**Solusi**: Pastikan kedua project sudah di network yang sama
```bash
docker network inspect tellyou---eai-main_shared-network
```
Harus ada container `toko-kue-mergedfixfe-gateway-1` dan `toko-kue-mergedfixfe-integration-1`

### Error: "Cannot query field createOrderToTellyou"
**Solusi**: Refresh schema di Apollo Sandbox (klik ikon reload di pojok kiri atas)

### Data tidak muncul di Frontend Tellyou
**Penyebab**: Bug di frontend Tellyou atau endpoint internal mereka salah
**Verifikasi**: Cek langsung di database Tellyou (lihat cara di atas)

### Tagihan tidak muncul di Toko Kue
**Solusi**: 
1. Cek log integration service
2. Pastikan Payment Service berjalan: `docker ps | grep payment`
3. Test manual ke Payment Service:
```bash
curl http://localhost:4004/payments
```

---

## 📊 Monitoring Real-time

### Monitor semua log sekaligus
```bash
# Terminal 1: Toko Kue Gateway
docker logs -f toko-kue-mergedfixfe-gateway-1

# Terminal 2: Toko Kue Integration
docker logs -f toko-kue-mergedfixfe-integration-1

# Terminal 3: Tellyou Stock-Payment
docker logs -f stock-payment-service
```

---

## ✅ Checklist Testing Lengkap

- [ ] Toko Kue bisa kirim order ke Tellyou via GraphQL
- [ ] Transaction tersimpan di database Tellyou
- [ ] Tellyou bisa update inventory Toko Kue via webhook
- [ ] Inventory Toko Kue berubah sesuai data dari Tellyou
- [ ] Tellyou bisa kirim invoice ke Toko Kue
- [ ] Invoice muncul di Payment Service Toko Kue
- [ ] Semua log integrasi tercatat di `integration_logs` table

---

**Catatan**: Semua endpoint webhook Toko Kue bisa diakses di:
- `http://localhost:4006/api/webhook/inventory-update`
- `http://localhost:4006/api/webhook/invoice`
- `http://localhost:4006/api/webhook/shipment`
