// src/pages/teacher/TeacherLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NAV_LINKS = [
  {
    to: "/teacher/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/teacher/courses",
    label: "Mening kurslarim",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    to: "/teacher/courses/new",
    label: "Yangi kurs yaratish",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

const TeacherLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobil: sahifa o'zgarsa sidebar yopilsin
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success("Tizimdan chiqildi");
    navigate("/login");
  };

  const teacherName =
    currentUser?.fullName || currentUser?.displayName || "O'qituvchi";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a" }}>
      {/* ── Mobil Overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 30,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        id="teacher-sidebar"
        style={{
          width: 260,
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          borderRight: "1px solid #1e293b",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 40,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
        className="teacher-sidebar"
      >
        {/* Logo / Brand */}
        <div
          style={{
            padding: "28px 24px 20px",
            borderBottom: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", lineHeight: 1.2 }}>
                KUAF To'garak
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>O'qituvchi paneli</div>
            </div>
          </div>

          {/* O'qituvchi info */}
          <div
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>Salom,</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#a5b4fc" }}>
              {teacherName}
            </div>
            <div
              style={{
                marginTop: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                color: "#34d399",
                background: "rgba(16,185,129,0.1)",
                borderRadius: 6,
                padding: "2px 8px",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399" }} />
              O'QITUVCHI
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px 8px" }}>
            Asosiy
          </div>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              id={`nav-${link.to.replace(/\//g, "-").slice(1)}`}
              end={link.to === "/teacher/dashboard"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 4,
                color: isActive ? "#a5b4fc" : "#94a3b8",
                background: isActive
                  ? "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(99,102,241,0.25)"
                  : "1px solid transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s",
              })}
            >
              <span style={{ flexShrink: 0 }}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            id="teacher-logout-btn"
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#f87171",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Chiqish
          </button>
        </div>
      </aside>

      {/* ── Desktop static sidebar spacer ── */}
      <div className="sidebar-spacer" style={{ width: 260, flexShrink: 0 }} />

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile Header */}
        <header
          id="teacher-mobile-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 20px",
            background: "#1e293b",
            borderBottom: "1px solid #1e293b",
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
          className="mobile-header"
        >
          <button
            id="teacher-hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menyu ochish"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 8,
              padding: "7px 9px",
              cursor: "pointer",
              color: "#a5b4fc",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>
            O'qituvchi Paneli
          </div>
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#64748b" }}>
            {teacherName}
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "32px 32px", overflowY: "auto" }} className="teacher-main">
          <Outlet />
        </main>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (min-width: 768px) {
          .teacher-sidebar {
            transform: translateX(0) !important;
            position: fixed !important;
          }
          .mobile-header {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .sidebar-spacer {
            display: none !important;
          }
          .teacher-main {
            padding: 20px 16px !important;
          }
        }
        .teacher-sidebar nav a:hover {
          background: rgba(99,102,241,0.1) !important;
          color: #c7d2fe !important;
        }
        #teacher-logout-btn:hover {
          background: rgba(239,68,68,0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default TeacherLayout;
