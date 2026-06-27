// src/pages/auth/RegisterPage.jsx
// Faqat talabalar uchun ro'yxatdan o'tish sahifasi
// Admin va o'qituvchilar faqat admin tomonidan yaratiladi

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { registerStudent } from "../../firebase/auth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async ({ fullName, email, password }) => {
    setIsLoading(true);
    try {
      await registerStudent(email, password, fullName);
      toast.success("Ro'yxatdan o'tish muvaffaqiyatli!");
      navigate("/student/dashboard");
    } catch (err) {
      console.error(err);
      const errorMessages = {
        "auth/email-already-in-use": "Bu email allaqachon ro'yxatdan o'tgan",
        "auth/invalid-email": "Email manzil noto'g'ri formatda",
        "auth/weak-password": "Parol juda zaif (kamida 6 ta belgi)",
      };
      const msg = errorMessages[err.code] || "Ro'yxatdan o'tish muvaffaqiyatsiz tugadi";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    background: "rgba(51, 65, 85, 0.6)",
    border: `1px solid ${hasError ? "#ef4444" : "rgba(99, 102, 241, 0.2)"}`,
    color: "#f1f5f9",
  });

  const handleFocus = (e) => { e.target.style.borderColor = "#6366f1"; };
  const handleBlur = (e, hasError) => {
    e.target.style.borderColor = hasError ? "#ef4444" : "rgba(99, 102, 241, 0.2)";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a1040 50%, #0f172a 100%)" }}
    >
      {/* Orqa fon bezaklari */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
      </div>

      {/* Karta */}
      <div className="animate-fade-in relative z-10 w-full max-w-md mx-4 my-8">
        <div
          className="rounded-2xl p-8 shadow-2xl border"
          style={{
            background: "rgba(30, 41, 59, 0.85)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(99, 102, 241, 0.2)",
          }}
        >
          {/* Logo / Sarlavha */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Ro'yxatdan o'tish</h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              Talaba sifatida hisob yaratish
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="register-form">

            {/* To'liq ism */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>
                To'liq ism va familiya
              </label>
              <input
                id="register-fullname"
                type="text"
                placeholder="Abdullayev Abdulla"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={inputStyle(!!errors.fullName)}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.fullName)}
                {...register("fullName", {
                  required: "To'liq ismni kiriting",
                  minLength: { value: 3, message: "Ism kamida 3 ta belgi bo'lishi kerak" },
                })}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>
                Email manzil
              </label>
              <input
                id="register-email"
                type="email"
                placeholder="student@mail.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={inputStyle(!!errors.email)}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.email)}
                {...register("email", {
                  required: "Email kiritish shart",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Noto'g'ri email format" },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{errors.email.message}</p>
              )}
            </div>

            {/* Parol */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>
                Parol
              </label>
              <input
                id="register-password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={inputStyle(!!errors.password)}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.password)}
                {...register("password", {
                  required: "Parol kiritish shart",
                  minLength: { value: 6, message: "Parol kamida 6 ta belgi bo'lishi kerak" },
                })}
              />
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{errors.password.message}</p>
              )}
            </div>

            {/* Parolni tasdiqlash */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>
                Parolni tasdiqlash
              </label>
              <input
                id="register-confirm-password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={inputStyle(!!errors.confirmPassword)}
                onFocus={handleFocus}
                onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
                {...register("confirmPassword", {
                  required: "Parolni tasdiqlang",
                  validate: (value) => value === password || "Parollar mos kelmaydi",
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Ro'yxatdan o'tish tugmasi */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isLoading
                  ? "rgba(139, 92, 246, 0.5)"
                  : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ro'yxatdan o'tilmoqda...
                </span>
              ) : "Ro'yxatdan o'tish"}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm mt-6" style={{ color: "#64748b" }}>
            Hisobingiz bormi?{" "}
            <Link
              to="/login"
              id="go-to-login-link"
              className="font-medium transition-colors"
              style={{ color: "#818cf8" }}
              onMouseEnter={(e) => e.target.style.color = "#a5b4fc"}
              onMouseLeave={(e) => e.target.style.color = "#818cf8"}
            >
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
