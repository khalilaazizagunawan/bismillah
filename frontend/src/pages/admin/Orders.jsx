import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client"
import { GET_ORDERS, UPDATE_ORDER_STATUS } from "../../graphql/orders"
import Modal from "../../components/ui/Modal"

export default function Orders() {
  const { data, loading, error, refetch } = useQuery(GET_ORDERS, {
    fetchPolicy: "cache-and-network",
    pollInterval: 5000, // Auto refresh every 5 seconds
    onCompleted: (data) => {
      console.log("✅ GET_ORDERS query completed:", data);
      console.log("Orders count:", data?.orders?.length || 0);
    },
    onError: (error) => {
      console.error("❌ GET_ORDERS query error:", error);
      console.error("Error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });
    },
  })

  const [updateOrderStatusMutation] = useMutation(UPDATE_ORDER_STATUS)

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "default" })

  const orders = data?.orders || []
  
  // Debug logging
  console.log("🔍 Orders component render:", {
    loading,
    error: error?.message,
    ordersCount: orders.length,
    hasData: !!data,
  })

  const updateStatus = async (id, newStatus) => {
    try {
      await updateOrderStatusMutation({
        variables: {
          id: String(id),
          status: newStatus,
        },
      })
      await refetch()
      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
      setModal({
        isOpen: true,
        title: "Berhasil",
        message: "Status pesanan berhasil diupdate!",
        type: "success",
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      setModal({
        isOpen: true,
        title: "Error",
        message: "Gagal mengupdate status pesanan",
        type: "error",
      })
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) return <div className="p-6 bg-pink-50 min-h-screen text-center py-20">Loading...</div>
  if (error) return <div className="p-6 bg-pink-50 min-h-screen text-center py-20 text-red-600">Error: {error.message}</div>

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-pink-600 mb-2">Customer Orders</h2>
        <p className="text-gray-600">View and manage customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Belum ada pesanan
        </div>
      ) : (
        <>
          {/* Orders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow p-4 hover:shadow-lg cursor-pointer transition"
                onClick={() => setSelectedOrder(order)}
              >
                <h3 className="text-lg font-semibold text-pink-700">{order.customer_name}</h3>
                <p className="text-gray-500 text-sm">{order.items.length} item(s)</p>
                <p className="text-pink-600 font-bold mt-2">{formatPrice(order.total)}</p>
                <p className={`mt-1 font-semibold ${
                  order.status === "Pending" ? "text-yellow-500" :
                  order.status === "Confirmed" ? "text-green-500" :
                  order.status === "Shipped" ? "text-blue-500" :
                  "text-gray-500"
                }`}>{order.status}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold"
              onClick={() => setSelectedOrder(null)}
            >
              X
            </button>

            <h2 className="text-2xl font-bold text-pink-700 mb-4">Order by {selectedOrder.customer_name}</h2>
            
            <div className="mb-4 space-y-2 text-sm text-gray-600">
              <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
              <p><strong>Address:</strong> {selectedOrder.customer_address}</p>
            </div>

            <div className="divide-y divide-gray-200 mb-4">
              {selectedOrder.items.map((item, index) => (
                <div key={`${item.cake_id}-${index}`} className="py-2 flex justify-between">
                  <span>{item.name} x {item.qty}</span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 font-bold text-right text-pink-600 text-lg">
              Total: {formatPrice(selectedOrder.total)}
            </p>

            {/* Update status */}
            <div className="mt-4 flex gap-2">
              {["Pending", "Confirmed", "Shipped"].map(status => (
                <button
                  key={status}
                  onClick={() => updateStatus(selectedOrder.id, status)}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    selectedOrder.status === status 
                      ? "bg-pink-600 text-white" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {status}
                </button>
              ))}
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