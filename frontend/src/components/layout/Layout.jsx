import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from '../cart/CartSidebar';

function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50"><Outlet /></main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

export default Layout;