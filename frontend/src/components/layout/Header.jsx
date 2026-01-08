import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CartIcon from "../cart/CartIcon"; // sesuaikan path jika beda

function Header() {
  const { isAdmin, logout } = useAuth();
  const location = useLocation();

  // Jika sedang di halaman admin (path dimulai dengan /admin), header tidak ditampilkan sama sekali
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo SweetCake */}
          <Link to="/" className="text-3xl font-bold text-primary">
            SweetCake
          </Link>

          {/* Right side: Nav + Cart + Admin Button */}
          <div className="flex items-center space-x-8">
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-10">
              <Link to="/" className="text-gray-700 hover:text-primary font-medium">
                Home
              </Link>
              <Link to="/katalog" className="text-gray-700 hover:text-primary font-medium">
                Katalog
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-700 hover:text-primary font-medium">
                  Admin
                </Link>
              )}
            </nav>

            {/* Cart Icon + Admin Login/Logout */}
            <div className="flex items-center space-x-6">
              <CartIcon />

              {isAdmin ? (
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
                >
                  Logout Admin
                </button>
              ) : (
                <Link
                  to="/login"
                  className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;