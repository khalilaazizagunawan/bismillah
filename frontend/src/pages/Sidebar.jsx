import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const menus = [
  { name: "Dashboard", path: "/admin" },
  { name: "Catalog Kue", path: "/admin/cakes" },
  { name: "Inventory", path: "/admin/inventory" },
  { name: "Orders", path: "/admin/orders" },
  { name: "Purchase Orders", path: "/admin/procurement" },
  { name: "Payment", path: "/admin/payments" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Yakin ingin logout?")) {
      logout();
      toast.success("Logout berhasil! Sampai jumpa lagi 👋");
      navigate("/");
    }
  };

  return (
    <aside className="w-72 min-h-screen bg-pink-600 text-white p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
      
      {/* Title */}
      <div className="relative z-10 mb-10">
        <h1 className="text-2xl font-bold mb-2">
          <span className="px-4 py-2 rounded-2xl">
            🍰 Sweet cake
          </span>
        </h1>
      </div>

      {/* Menu */}
      <nav className="space-y-2 relative z-10">
        {menus.map((menu) => {
          const isActive =
            location.pathname === menu.path ||
            (menu.path !== "/admin" && location.pathname.startsWith(menu.path));

          return (
            <NavLink
              key={menu.name}
              to={menu.path}
              className={`group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-medium text-lg ${
                isActive
                  ? "bg-white text-pink-600 shadow-xl scale-105"
                  : "hover:bg-white/20 hover:scale-102 text-white/90 hover:text-white"
              }`}
            >
              <span className="flex-1">{menu.name}</span>
              {isActive && (
                <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              )}
            </NavLink>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            w-full mt-6
            flex items-center justify-center gap-3
            px-5 py-4 rounded-2xl
            border-2 border-white/50
            text-white font-semibold text-lg
            bg-white/10 backdrop-blur-sm
            hover:bg-white hover:text-pink-600 hover:border-white
            transition-all duration-300
            transform hover:scale-105
            shadow-lg hover:shadow-xl
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </nav>

      {/* Footer decoration - removed */}
    </aside>
  );
}
