import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_PURCHASE_ORDER } from "../../graphql/purchaseOrders";

export default function PODetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(GET_PURCHASE_ORDER, {
    variables: { id: String(id) }, // Ensure ID is string
    fetchPolicy: "network-only",
    errorPolicy: "all", // Don't throw on error, return it
  });

  // Debug logging
  console.log("PODetail - ID from params:", id);
  console.log("PODetail - Query data:", data);
  console.log("PODetail - Query loading:", loading);
  console.log("PODetail - Query error:", error);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 text-lg">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/admin/procurement")}
          className="mb-4 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Purchase Orders
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">Error loading purchase order</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const po = data?.purchaseOrder;
  if (!po) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/admin/procurement")}
          className="mb-4 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Purchase Orders
        </button>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-600">Purchase order not found</p>
        </div>
      </div>
    );
  }

  // Parse items - could be JSON string from database or already an array
  let items = [];
  if (typeof po.items === 'string') {
    try {
      items = JSON.parse(po.items);
    } catch (e) {
      console.error('Error parsing items JSON:', e);
      items = [];
    }
  } else if (Array.isArray(po.items)) {
    items = po.items;
  }
  const totalQty = items.reduce((sum, i) => sum + Number(i.qty || 0), 0);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/procurement")}
        className="mb-6 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition transform hover:scale-105"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Purchase Orders
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-2">Purchase Order Details</h2>
        <p className="text-gray-500">PO ID: #{po.id}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-medium uppercase mb-2">Supplier</p>
          <p className="text-2xl font-bold text-gray-800">{po.supplier || "N/A"}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500">
          <p className="text-gray-500 text-sm font-medium uppercase mb-2">Status</p>
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
              po.status
            )}`}
          >
            {po.status || "UNKNOWN"}
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-medium uppercase mb-2">Total Items</p>
          <p className="text-2xl font-bold text-gray-800">{totalQty}</p>
        </div>
      </div>

      {/* Created Date */}
      {po.createdAt && (
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <p className="text-gray-500 text-sm">Created At</p>
          <p className="text-gray-800 font-medium">{formatDate(po.createdAt)}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Order Items</h3>
        </div>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Item Name</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-pink-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{item.name || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-700">{item.qty || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-600">{item.unit || "pcs"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p>No items in this purchase order</p>
          </div>
        )}
      </div>
    </div>
  );
}
