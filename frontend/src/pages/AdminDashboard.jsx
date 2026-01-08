import { useQuery } from "@apollo/client";
import { GET_ORDERS } from "../graphql/orders";
import { GET_PAYMENTS } from "../graphql/payments";
import { GET_CAKES } from "../graphql/cakes";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts";

const COLORS = ['#F472B6', '#EC4899', '#DB2777', '#BE185D'];

export default function AdminDashboard() {
  // Real-time queries with polling
  const { data: ordersData, loading: ordersLoading } = useQuery(GET_ORDERS, {
    pollInterval: 5000, // Refresh every 5 seconds
    fetchPolicy: "network-only",
  });

  const { data: paymentsData, loading: paymentsLoading } = useQuery(GET_PAYMENTS, {
    pollInterval: 5000,
    fetchPolicy: "network-only",
  });

  const { data: cakesData, loading: cakesLoading } = useQuery(GET_CAKES, {
    variables: { activeOnly: false },
    pollInterval: 10000, // Refresh every 10 seconds (cakes change less frequently)
    fetchPolicy: "network-only",
  });

  const orders = ordersData?.orders || [];
  const payments = paymentsData?.payments || [];
  const cakes = cakesData?.cakes || [];

  // Calculate statistics
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => 
    o.status === "Pending" || o.status === "Confirmed" || o.status === "Shipped"
  ).length;
  
  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  
  const pendingPayments = payments.filter(p => p.status === "UNPAID").length;

  // Top selling cakes (based on orders)
  const cakeSales = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      const cakeName = item.name;
      cakeSales[cakeName] = (cakeSales[cakeName] || 0) + item.qty;
    });
  });

  const topSellingCakes = Object.entries(cakeSales)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Order status distribution for chart
  const statusCount = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
  }));

  // Payment status data
  const paymentStatusData = [
    {
      status: "Paid",
      amount: payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + (p.amount || 0), 0),
    },
    {
      status: "Unpaid",
      amount: payments.filter(p => p.status === "UNPAID").reduce((sum, p) => sum + (p.amount || 0), 0),
    },
  ];

  // Recent orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const loading = ordersLoading || paymentsLoading || cakesLoading;

  if (loading && !orders.length && !payments.length) {
    return (
      <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-pink-600 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Real-time overview of your cake shop</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500 transform transition hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 uppercase text-sm font-medium">Total Orders</p>
              <p className="text-4xl font-bold text-pink-600 mt-2">{totalOrders}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{activeOrders} active</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 transform transition hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 uppercase text-sm font-medium">Revenue</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatPrice(totalRevenue).replace("Rp", "Rp ").trim()}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 transform transition hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 uppercase text-sm font-medium">Active Orders</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">{activeOrders}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">In progress</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500 transform transition hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 uppercase text-sm font-medium">Pending Payments</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{pendingPayments}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">From suppliers</p>
        </div>
      </div>

      {/* Charts and Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Status Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-pink-700 mb-4">Order Status Distribution</h2>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderStatusData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F472B6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-400">No orders yet</div>
          )}
        </div>

        {/* Payment Status Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-pink-700 mb-4">Payment Status</h2>
          {paymentStatusData.length > 0 && paymentStatusData.some(p => p.amount > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, amount }) => `${status}: ${formatPrice(amount)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPrice(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-400">No payments yet</div>
          )}
        </div>
      </div>

      {/* Top Selling Cakes & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Cakes */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-pink-700 mb-4">Top Selling Cakes</h2>
          {topSellingCakes.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {topSellingCakes.map((cake, idx) => (
                <li key={cake.name} className="py-3 flex justify-between items-center hover:bg-pink-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-pink-400 w-8">#{idx + 1}</span>
                    <span className="font-medium text-gray-800">{cake.name}</span>
                  </div>
                  <span className="font-bold text-pink-600 text-lg">{cake.sales} pcs</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16 text-gray-400">No sales data yet</div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-pink-700 mb-4">Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <li key={order.id} className="py-3 hover:bg-pink-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{order.customer_name}</p>
                      <p className="text-gray-500 text-sm">{formatDate(order.created_at)}</p>
                      <p className="text-gray-500 text-sm">{order.items?.length || 0} item(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-600">{formatPrice(order.total)}</p>
                      <p className={`text-sm font-medium mt-1 ${
                        order.status === "Pending" ? "text-yellow-500" :
                        order.status === "Confirmed" ? "text-green-500" :
                        order.status === "Shipped" ? "text-blue-500" :
                        "text-gray-500"
                      }`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16 text-gray-400">No orders yet</div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <p className="text-gray-500 text-sm font-medium">Total Products</p>
          <p className="text-3xl font-bold text-pink-600 mt-2">{cakes.length}</p>
          <p className="text-sm text-gray-400 mt-1">
            {cakes.filter(c => c.is_active).length} active
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <p className="text-gray-500 text-sm font-medium">Average Order Value</p>
          <p className="text-3xl font-bold text-pink-600 mt-2">
            {totalOrders > 0 
              ? formatPrice(Math.round(totalRevenue / totalOrders))
              : formatPrice(0)
            }
          </p>
          <p className="text-sm text-gray-400 mt-1">Per order</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <p className="text-gray-500 text-sm font-medium">Payment Completion</p>
          <p className="text-3xl font-bold text-pink-600 mt-2">
            {payments.length > 0
              ? Math.round((payments.filter(p => p.status === "PAID").length / payments.length) * 100)
              : 0}%
          </p>
          <p className="text-sm text-gray-400 mt-1">All payments</p>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live data • Auto-refresh every 5 seconds</span>
        </div>
      </div>
    </div>
  );
}
