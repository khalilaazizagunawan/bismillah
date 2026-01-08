import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client"
import { GET_PAYMENTS, PAY_PAYMENT } from "../../graphql/payments"
import Modal from "../../components/ui/Modal"

export default function Payments() {
  const { data, loading, error, refetch } = useQuery(GET_PAYMENTS, {
    fetchPolicy: "cache-and-network",
    pollInterval: 5000, // Auto refresh every 5 seconds
  })

  const [payPaymentMutation] = useMutation(PAY_PAYMENT)
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "default" })

  const payments = data?.payments || []

  const pay = async (id) => {
    try {
      const { data: result } = await payPaymentMutation({
        variables: { id: String(id) },
      })

      if (result?.payPayment) {
        let message = result.payPayment.message || "Pembayaran berhasil!";
        // Show inventory updates if any
        if (result.payPayment.inventoryUpdates?.length > 0) {
          const updates = result.payPayment.inventoryUpdates
          const errors = updates.filter(u => u.error).map(u => `${u.name}: ${u.error}`)
          if (errors.length > 0) {
            message += "\n\n" + errors.join("\n")
          }
        }
        setModal({
          isOpen: true,
          title: "Berhasil",
          message: message,
          type: "success",
        })
        await refetch()
      }
    } catch (err) {
      console.error("Payment error:", err)
      setModal({
        isOpen: true,
        title: "Error",
        message: err.message || "Gagal melakukan pembayaran",
        type: "error",
      })
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-pink-600 mb-2">Payments</h2>
        <p className="text-gray-600">Manage supplier invoices and payments</p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Belum ada tagihan dari supplier
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map((p) => {
            const items = Array.isArray(p.items) ? p.items : []
            const status = p.status || "UNPAID"
            const isPaid = status === "PAID"
            
            return (
            <div
              key={p.id}
              className={`bg-gradient-to-b ${
                isPaid
                  ? "from-green-100 to-green-200"
                  : "from-pink-100 to-pink-200"
              } rounded-2xl shadow-lg p-5 flex flex-col justify-between transition-transform hover:scale-105`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">
                    {p.invoiceNumber || `Invoice #${p.id}`}
                  </h3>
                  <span
                    className={`px-2 py-1 text-sm rounded-full font-medium ${
                      isPaid
                        ? "bg-green-500 text-white"
                        : "bg-yellow-300 text-yellow-900"
                    }`}
                  >
                    {isPaid ? "PAID" : "UNPAID"}
                  </span>
                </div>
                {p.supplierName && (
                  <p className="text-gray-600 text-sm mb-1">
                    Supplier: {p.supplierName}
                  </p>
                )}
                <p className="text-gray-500 text-sm mb-2">
                  Due: {formatDate(p.dueDate)}
                </p>
                <p className="text-lg font-bold text-pink-700 mb-3">
                  {formatPrice(p.amount)}
                </p>
                <div className="space-y-1">
                  {items.length > 0 ? (
                    items.map((item, idx) => (
                      <p key={idx} className="text-gray-700 text-sm">
                        • {item.name} ({item.qty} {item.unit || "pcs"})
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No items</p>
                  )}
                </div>
              </div>

              {!isPaid && (
                <button
                  onClick={() => pay(p.id)}
                  className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-xl shadow-md transition"
                >
                  Bayar Sekarang
                </button>
              )}
              {isPaid && p.paidAt && (
                <p className="mt-4 text-sm text-gray-600">
                  Paid: {formatDate(p.paidAt)}
                </p>
              )}
            </div>
            )
          })}
        </div>
      )}

      {/* Notification Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        type={modal.type}
      >
        <p className="text-lg whitespace-pre-line">{modal.message}</p>
      </Modal>
    </div>
  )
}