import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Tizimdan chiqildi");
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { name: "Kurslar", path: "/admin/courses", icon: "📚" },
    { name: "O'qituvchilar", path: "/admin/teachers", icon: "👨‍🏫" },
    { name: "Xonalar", path: "/admin/rooms", icon: "🚪" },
    { name: "Talabalar", path: "/admin/students", icon: "🎓" },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-700 z-30 transition-transform duration-300 transform 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-700 bg-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">KU</span>
          </div>
          <span className="text-lg font-bold tracking-wider">ADMIN</span>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-slate-800/50 border-b border-slate-700 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 rounded-lg bg-slate-700 text-slate-300 lg:hidden hover:bg-slate-600 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-medium hidden sm:block">
              Salom, {currentUser?.fullName || currentUser?.displayName || "Admin"} 👋
            </h2>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl hover:bg-red-400/20 transition-colors flex items-center gap-2"
          >
            <span>Chiqish</span>
          </button>
        </header>

        {/* Page Content (Outlet) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 p-6 relative">
          <div className="absolute top-0 left-0 w-full h-96 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
