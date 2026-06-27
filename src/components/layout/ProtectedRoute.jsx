// src/components/layout/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Route'ni himoya qiladi:
 * - Agar login qilinmagan bo'lsa → /login ga yo'naltiradi
 * - Agar role mos kelmasa → o'ziga mos dashboard ga yo'naltiradi
 *
 * Ishlatish:
 *   <ProtectedRoute allowedRoles={['admin']}>
 *     <AdminPage />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();

  // Login qilinmagan
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role tekshirish
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Foydalanuvchini o'ziga mos dashboard ga yuboramiz
    const dashboardMap = {
      admin: "/admin/dashboard",
      teacher: "/teacher/dashboard",
      student: "/student/dashboard",
    };
    const redirectTo = dashboardMap[currentUser.role] || "/login";
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
