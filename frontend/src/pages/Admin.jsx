import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user?.role !== 'admin') {
    return <p className="text-center py-20 text-2xl">Akses ditolak. Hanya untuk admin.</p>;
  }

  // Simulasi daftar pesanan (bisa simpan di localStorage nanti)
  const orders = [
    { id: 1, customer: 'Budi', total: 350000, status: 'Pending' },
    { id: 2, customer: 'Siti', total: 700000, status: 'Dikirim' },
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600">
          Logout
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Daftar Pesanan</h2>
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-4">{order.id}</td>
                <td className="p-4">{order.customer}</td>
                <td className="p-4">Rp {order.total.toLocaleString('id-ID')}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${order.status === 'Pending' ? 'bg-yellow-200' : 'bg-green-200'}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Admin;