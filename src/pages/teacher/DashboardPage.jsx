// src/pages/teacher/DashboardPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTeacherCourses } from "../../firebase/firestore";

const DAY_NAMES = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

const formatSchedule = (schedule) => {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return "—";
  return schedule
    .map((s) => `${DAY_NAMES[s.dayOfWeek] ?? "?"} ${s.startTime}–${s.endTime}`)
    .join(", ");
};

// ── Loading Skeleton ──────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div
    style={{
      background: "#1e293b",
      border: "1px solid #1e293b",
      borderRadius: 16,
      padding: 24,
      animation: "pulse 1.6s ease-in-out infinite",
    }}
  >
    <div style={{ height: 12, width: "60%", background: "#334155", borderRadius: 6, marginBottom: 12 }} />
    <div style={{ height: 10, width: "40%", background: "#334155", borderRadius: 6, marginBottom: 20 }} />
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ height: 28, flex: 1, background: "#334155", borderRadius: 6 }} />
      <div style={{ height: 28, flex: 1, background: "#334155", borderRadius: 6 }} />
    </div>
  </div>
);

// ── Course Card ───────────────────────────────────────────────────────────
const CourseCard = ({ course, onClick }) => {
  const fillPct = course.capacity > 0
    ? Math.min(100, Math.round((course.enrolledCount / course.capacity) * 100))
    : 0;

  return (
    <div
      id={`course-card-${course.id}`}
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #162032 100%)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 16,
        padding: 24,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        animation: "fadeIn 0.4s ease both",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, marginBottom: 6 }}>
            {course.title}
          </h3>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 600,
              color: "#a5b4fc",
              background: "rgba(99,102,241,0.15)",
              borderRadius: 6,
              padding: "2px 8px",
            }}
          >
            {course.subject || "Fan ko'rsatilmagan"}
          </span>
        </div>
        <span
          style={{
            marginLeft: 12,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
            background: course.isActive
              ? "rgba(16,185,129,0.12)"
              : "rgba(100,116,139,0.12)",
            color: course.isActive ? "#34d399" : "#64748b",
            border: `1px solid ${course.isActive ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)"}`,
            flexShrink: 0,
          }}
        >
          {course.isActive ? "✓ Faol" : "Nofaol"}
        </span>
      </div>

      {/* Info rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        <InfoRow icon="🕐" label="Jadval" value={formatSchedule(course.schedule)} />
        <InfoRow icon="🏫" label="Xona" value={course.roomName || "—"} />
      </div>

      {/* Capacity bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Talabalar</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
            {course.enrolledCount ?? 0} / {course.capacity ?? "—"}
          </span>
        </div>
        <div style={{ height: 5, background: "#0f172a", borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${fillPct}%`,
              background: fillPct >= 90
                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                : "linear-gradient(90deg, #6366f1, #8b5cf6)",
              borderRadius: 99,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Arrow */}
      <div style={{ position: "absolute", bottom: 20, right: 20, color: "#475569", fontSize: 18 }}>→</div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ fontSize: 14 }}>{icon}</span>
    <span style={{ fontSize: 12, color: "#64748b", minWidth: 48 }}>{label}:</span>
    <span style={{ fontSize: 13, color: "#94a3b8" }}>{value}</span>
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────
const EmptyState = ({ onNew }) => (
  <div
    style={{
      textAlign: "center",
      padding: "80px 40px",
      background: "#1e293b",
      borderRadius: 20,
      border: "1px dashed #334155",
      animation: "fadeIn 0.4s ease both",
    }}
  >
    <div style={{ fontSize: 64, marginBottom: 20 }}>📚</div>
    <h3 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>
      Sizda hali to'garak yo'q
    </h3>
    <p style={{ margin: "0 0 28px", color: "#64748b", fontSize: 15 }}>
      Yangi to'garak yarating va talabalaringizni boshqarishni boshlang!
    </p>
    <button
      id="empty-create-course-btn"
      onClick={onNew}
      style={{
        padding: "12px 28px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
        transition: "all 0.2s",
      }}
    >
      ✚ Yangi to'garak yaratish
    </button>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getTeacherCourses(currentUser.uid);
        setCourses(data);
      } catch (err) {
        setError("Kurslarni yuklashda xato yuz berdi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.uid]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2 }}>
            Mening kurslarim
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 15 }}>
            {!loading && `${courses.length} ta to'garak topildi`}
          </p>
        </div>
        <button
          id="create-course-btn"
          onClick={() => navigate("/teacher/courses/new")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Yangi kurs yaratish
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#f87171", marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && courses.length === 0 && (
        <EmptyState onNew={() => navigate("/teacher/courses/new")} />
      )}

      {/* Courses Grid */}
      {!loading && !error && courses.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
