import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import ProtectedAdmin from './pages/ProtectedAdmin';
import AdminDashboard from './pages/AdminDashboard';  
import Cakes from './pages/admin/Cakes';
import Inventory from './pages/admin/Inventory';
import Orders from './pages/admin/Orders';
import PODetail from './pages/admin/PODetail';
import Payments from './pages/admin/Payments';
import Procurement from './pages/admin/Procurement';


function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman customer - pakai header SweetCake */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/katalog" element={<Catalog />} />
          <Route path="/produk/:id" element={<ProductDetail />} />
          <Route path="/tentang" element={<About />} />
          <Route path="/kontak" element={<Contact />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Halaman admin - pakai layout admin (sidebar + dashboard) */}
        <Route element={<ProtectedAdmin />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/cakes" element={<Cakes />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/po/:id" element={<PODetail />} />
          <Route path="/admin/payments" element={<Payments />} />
          <Route path="/admin/procurement" element={<Procurement />} />
          {/* backward-compatibility: some links previously pointed to the file path */}
          <Route path="/admin/PODetail.jsx" element={<Navigate to="/admin/procurement" replace />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;