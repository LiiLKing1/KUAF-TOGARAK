// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import CoursesPage from "./pages/admin/CoursesPage";
import CourseDetailPage from "./pages/admin/CourseDetailPage";
import TeachersPage from "./pages/admin/TeachersPage";
import RoomsPage from "./pages/admin/RoomsPage";
import StudentsPage from "./pages/admin/StudentsPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";

// Root yo'naltiruvchi: login bo'lgan foydalanuvchini rolga qarab dashboard'ga yuboradi
const RootRedirect = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  const dashboardMap = {
    admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
    student: "/student/dashboard",
  };

  return <Navigate to={dashboardMap[currentUser.role] || "/login"} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Umumiy yo'l */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth sahifalari */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin sahifalari (faqat admin role) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="students" element={<StudentsPage />} />
      </Route>

      {/* Teacher sahifalari (faqat teacher role) */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* Student sahifalari (faqat student role) */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 — noma'lum yo'llarni login ga yuborish */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* React Hot Toast bildirish tizimi */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
