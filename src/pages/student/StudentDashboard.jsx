// src/pages/student/StudentDashboard.jsx
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Tizimdan chiqildi");
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-8" style={{ background: "#0f172a", color: "#f1f5f9" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
              TALABA
            </span>
            <h1 className="text-3xl font-bold mt-2">
              Salom, {currentUser?.fullName || currentUser?.displayName || "Talaba"}! 👋
            </h1>
            <p style={{ color: "#94a3b8" }}>Role: <strong style={{ color: "#818cf8" }}>student</strong></p>
          </div>
          <button
            id="student-logout-btn"
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.2)" }}
          >
            Chiqish
          </button>
        </div>
        <div className="rounded-2xl p-6 border" style={{ background: "#1e293b", borderColor: "#334155" }}>
          <p className="text-center" style={{ color: "#64748b" }}>
            🚧 Talaba moduli tayyorlanmoqda — <code style={{ color: "#818cf8" }}>03-STUDENT-rol.md</code> bo'yicha davom eting
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
