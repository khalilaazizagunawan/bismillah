import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation } from "@apollo/client"
import { GET_PURCHASE_ORDERS } from "../../graphql/purchaseOrders"
import { gql } from "@apollo/client"
import Modal from "../../components/ui/Modal"

const CREATE_PURCHASE_ORDER = gql`
  mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(input: $input) {
      id
      supplier
      status
      items
      createdAt
    }
  }
`

export default function Procurement() {
  const { data, loading, error, refetch } = useQuery(GET_PURCHASE_ORDERS, {
    pollInterval: 5000, // Auto refresh every 5 seconds
    fetchPolicy: "network-only",
  })

  const [createPurchaseOrder] = useMutation(CREATE_PURCHASE_ORDER, {
    onCompleted: () => {
      refetch()
      setShowForm(false)
      setItems([{ name: "", qty: "", unit: "pcs" }])
      setModal({
        isOpen: true,
        title: "Berhasil",
        message: "Purchase Order berhasil dibuat!",
        type: "success",
      })
    },
    onError: (error) => {
      console.error("Error creating purchase order:", error)
      setModal({
        isOpen: true,
        title: "Error",
        message: `Gagal membuat Purchase Order: ${error.message}`,
        type: "error",
      })
    },
  })

  const [showForm, setShowForm] = useState(false)
  const [items, setItems] = useState([{ name: "", qty: "", unit: "pcs" }])
  const [selectedPO, setSelectedPO] = useState(null) // untuk detail
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "default" })

  // Get purchase orders from GraphQL - filter out invalid IDs (localStorage timestamps)
  const pos = (data?.purchaseOrders || []).filter(po => {
    // Only show purchase orders with valid integer IDs (from database)
    // Filter out timestamp-based IDs from localStorage (too large for integer)
    const id = typeof po.id === 'string' ? parseInt(po.id) : po.id;
    return !isNaN(id) && id < 2147483647; // PostgreSQL integer max value
  })


  const addItem = () => setItems([...items, { name: "", qty: "", unit: "pcs" }])

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value
    setItems(updated)
  }

  const createPO = async () => {
    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name || items[i].name.trim() === "") {
        setModal({
          isOpen: true,
          title: "Validasi Error",
          message: "Nama bahan tidak boleh kosong",
          type: "error",
        })
        return
      }
      const qty = Number(items[i].qty)
      if (qty <= 0 || isNaN(qty)) {
        setModal({
          isOpen: true,
          title: "Validasi Error",
          message: "Qty harus angka lebih dari 0",
          type: "error",
        })
        return
      }
    }

    try {
      // Prepare items for GraphQL mutation
      const itemsInput = items.map(item => ({
        name: item.name.trim(),
        qty: Number(item.qty),
        unit: item.unit || "pcs"
      }))

      await createPurchaseOrder({
        variables: {
          input: {
            supplier: "Supplier Kelompok A",
            items: itemsInput,
          },
        },
      })
    } catch (error) {
      console.error("Error creating PO:", error)
      // Error handling is done in onError callback
    }
  }

  if (loading && pos.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
            <p className="text-pink-600 text-lg">Loading purchase orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">Error loading purchase orders</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Procurement</h2>

      {/* FORM PO */}
      <button
        onClick={() => setShowForm(true)}
        className="bg-pink-600 text-white px-5 py-2 rounded-xl mb-6 hover:bg-pink-700 transition"
      >
        Buat Purchase Order
      </button>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Detail Purchase Order</h3>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 items-center">
                <input
                  className="border rounded-lg px-3 py-2"
                  placeholder="Nama Bahan"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded-lg px-3 py-2"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={(e) => updateItem(i, "qty", e.target.value)}
                />
                <select
                  className="border rounded-lg px-3 py-2"
                  value={item.unit}
                  onChange={(e) => updateItem(i, "unit", e.target.value)}
                >
                  <option value="pcs">pcs</option>
                  <option value="gram">gram</option>
                  <option value="kilogram">kilogram</option>
                  <option value="liter">liter</option>
                </select>
              </div>
            ))}
            <button onClick={addItem} className="text-pink-600 font-medium">
              + Tambah Bahan
            </button>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={createPO}
                className="px-4 py-2 rounded-lg bg-pink-600 text-white"
              >
                Simpan Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS GRID */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Daftar Orders Bahan</h3>
        {pos.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">Belum ada purchase order. Buat purchase order pertama Anda!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pos.map((o) => {
              // Parse items if it's a JSON string
              const itemsArray = typeof o.items === 'string' ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : [])
              return (
                <div
                  key={o.id}
                  className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition"
                  onClick={() => setSelectedPO(o)}
                >
                  <p className="text-gray-500 font-medium">Order #{o.id}</p>
                  <p>Status: <span className="font-bold">{o.status || "PENDING"}</span></p>
                  <p>Total Item: {itemsArray.length}</p>

                  <div className="pt-2">
                    <Link 
                      to={`/admin/po/${o.id}`} 
                      className="text-pink-600 font-medium hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Validate ID before navigation
                        const poId = typeof o.id === 'string' ? parseInt(o.id) : o.id;
                        if (isNaN(poId) || poId >= 2147483647) {
                          e.preventDefault();
                          setModal({
                            isOpen: true,
                            title: "Error",
                            message: "Purchase order ID tidak valid. Hanya purchase order dari database yang dapat dilihat detailnya.",
                            type: "error",
                          });
                        }
                      }}
                    >
                      Lihat Halaman PO
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-500 font-bold text-2xl hover:text-gray-700"
              onClick={() => setSelectedPO(null)}
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-4">Detail Order #{selectedPO.id}</h3>
            <p className="text-gray-500 mb-2">
              Tanggal: {selectedPO.createdAt ? new Date(selectedPO.createdAt).toLocaleString("id-ID") : "N/A"}
            </p>
            <p className="text-gray-500 mb-2">Supplier: {selectedPO.supplier || "N/A"}</p>
            <p className="text-gray-500 mb-4">Status: <span className="font-bold">{selectedPO.status || "PENDING"}</span></p>
            <div className="space-y-2">
              {(() => {
                const itemsArray = typeof selectedPO.items === 'string' 
                  ? JSON.parse(selectedPO.items) 
                  : (Array.isArray(selectedPO.items) ? selectedPO.items : [])
                return itemsArray.map((i, idx) => (
                  <div key={idx} className="p-2 border rounded-lg">
                    <p className="font-semibold">{i.name}</p>
                    <p>Qty: {i.qty} {i.unit || "pcs"}</p>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        type={modal.type}
      >
        <p className="text-lg">{modal.message}</p>
      </Modal>
    </div>
  )
}