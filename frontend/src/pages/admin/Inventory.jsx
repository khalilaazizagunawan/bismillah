import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_INVENTORIES, UPDATE_INVENTORY } from "../../graphql/inventory";
import Modal from "../../components/ui/Modal";

export default function Inventory() {
  const { data, loading, error, refetch } = useQuery(GET_INVENTORIES, {
    fetchPolicy: "cache-and-network",
    pollInterval: 5000, // Auto refresh every 5 seconds
  });

  const [updateInventoryMutation] = useMutation(UPDATE_INVENTORY);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "default" });

  const inventories = data?.inventories || [];

  const updateStock = async (id, currentStock, change) => {
    const newStock = Math.max(currentStock + change, 0);
    try {
      await updateInventoryMutation({
        variables: {
          id: String(id),
          input: { stock: newStock },
        },
      });
      setModal({
        isOpen: true,
        title: "Berhasil",
        message: "Stock berhasil diupdate!",
        type: "success",
      });
      await refetch();
    } catch (err) {
      console.error("Update stock error:", err);
      setModal({
        isOpen: true,
        title: "Error",
        message: "Gagal update stock",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 text-lg">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center min-h-screen flex items-center justify-center">
        <div>
          <p className="text-2xl mb-2">❌</p>
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-pink-600 mb-2">Inventory</h2>
        <p className="text-gray-600">Manage your ingredient stock</p>
      </div>

      {inventories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">Belum ada inventory</p>
          <p className="text-gray-400 text-sm mt-2">
            Inventory akan otomatis terupdate ketika melakukan pembayaran ke supplier
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {inventories.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:scale-105 border-l-4 ${
                item.stock === 0
                  ? "border-red-500 bg-red-50/30"
                  : item.stock < 10
                  ? "border-yellow-500 bg-yellow-50/30"
                  : "border-green-500"
              }`}
            >
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.name}</h3>
                <div className="mb-4">
                  <p
                    className={`text-3xl font-bold mb-1 ${
                      item.stock === 0
                        ? "text-red-500"
                        : item.stock < 10
                        ? "text-yellow-500"
                        : "text-green-600"
                    }`}
                  >
                    {item.stock}
                  </p>
                  <p className="text-gray-500 text-sm">{item.unit || "pcs"}</p>
                </div>
                {item.stock === 0 && (
                  <div className="bg-red-100 border border-red-300 rounded-xl p-3 mb-4">
                    <p className="text-red-700 text-sm font-medium">
                      Stok habis, segera restock!
                    </p>
                  </div>
                )}
                {item.stock > 0 && item.stock < 10 && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-3 mb-4">
                    <p className="text-yellow-700 text-sm font-medium">
                      Stok menipis
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => updateStock(item.id, item.stock, -1)}
                  className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center text-2xl font-bold"
                  disabled={item.stock === 0}
                >
                  −
                </button>
                <button
                  onClick={() => updateStock(item.id, item.stock, 1)}
                  className="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>
          ))}
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
  );
}
