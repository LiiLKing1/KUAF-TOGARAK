// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";

// Teacher module
import TeacherLayout from "./pages/teacher/TeacherLayout";
import DashboardPage from "./pages/teacher/DashboardPage";
import CreateCoursePage from "./pages/teacher/CreateCoursePage";
import CourseDetailPage from "./pages/teacher/CourseDetailPage";
import EditCoursePage from "./pages/teacher/EditCoursePage";

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
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── Teacher sahifalari (nested, faqat teacher role) ── */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        {/* /teacher → /teacher/dashboard ga redirect */}
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Mening kurslarim → Dashboard bilan bir xil (sidebar link) */}
        <Route path="courses" element={<DashboardPage />} />

        {/* Yangi kurs yaratish */}
        <Route path="courses/new" element={<CreateCoursePage />} />

        {/* Kurs detail */}
        <Route path="courses/:courseId" element={<CourseDetailPage />} />

        {/* Kursni tahrirlash */}
        <Route path="courses/:courseId/edit" element={<EditCoursePage />} />
      </Route>

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
