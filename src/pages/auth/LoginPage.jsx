// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const user = await login(email, password);

      // Role ma'lumoti AuthContext orqali keladi, lekin login qaytargan user'dan olamiz
      // AuthContext onAuthStateChanged orqali yangilanadi, shuning uchun kutamiz
      // Firestore'dan role olinadi, shu sababli navigatsiya kechiktiriladi
      toast.success("Muvaffaqiyatli kirildi!");

      // AuthContext ga vaqt beramiz (onAuthStateChanged ishga tushishi uchun)
      // Keyin ProtectedRoute o'zi to'g'ri sahifaga yo'naltiradi
      navigate("/");
    } catch (err) {
      console.error(err);
      const errorMessages = {
        "auth/user-not-found": "Bu email bilan foydalanuvchi topilmadi",
        "auth/wrong-password": "Noto'g'ri parol",
        "auth/invalid-credential": "Email yoki parol noto'g'ri",
        "auth/invalid-email": "Email manzil noto'g'ri formatda",
        "auth/too-many-requests": "Ko'p urinishlar. Keyinroq qayta urining",
        "auth/user-disabled": "Foydalanuvchi bloklangan",
      };
      const msg = errorMessages[err.code] || "Kirish muvaffaqiyatsiz tugadi";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>

      {/* Orqa fon bezaklari */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
      </div>

      {/* Karta */}
      <div className="animate-fade-in relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl p-8 shadow-2xl border"
          style={{
            background: "rgba(30, 41, 59, 0.8)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(99, 102, 241, 0.2)",
          }}>

          {/* Logo / Sarlavha */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">KUAF-TOGARAK</h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Tizimga kirish</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>
                Email manzil
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="example@mail.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "rgba(51, 65, 85, 0.6)",
                  border: errors.email ? "1px solid #ef4444" : "1px solid rgba(99, 102, 241, 0.2)",
                  color: "#f1f5f9",
                }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = errors.email ? "#ef4444" : "rgba(99, 102, 241, 0.2)"}
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
                id="login-password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "rgba(51, 65, 85, 0.6)",
                  border: errors.password ? "1px solid #ef4444" : "1px solid rgba(99, 102, 241, 0.2)",
                  color: "#f1f5f9",
                }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = errors.password ? "#ef4444" : "rgba(99, 102, 241, 0.2)"}
                {...register("password", {
                  required: "Parol kiritish shart",
                  minLength: { value: 6, message: "Parol kamida 6 ta belgi bo'lishi kerak" },
                })}
              />
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{errors.password.message}</p>
              )}
            </div>

            {/* Kirish tugmasi */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isLoading
                  ? "rgba(99, 102, 241, 0.5)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Kirilmoqda...
                </span>
              ) : "Kirish"}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm mt-6" style={{ color: "#64748b" }}>
            Hisob yo'qmi?{" "}
            <Link
              to="/register"
              id="go-to-register-link"
              className="font-medium transition-colors"
              style={{ color: "#818cf8" }}
              onMouseEnter={(e) => e.target.style.color = "#a5b4fc"}
              onMouseLeave={(e) => e.target.style.color = "#818cf8"}
            >
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
