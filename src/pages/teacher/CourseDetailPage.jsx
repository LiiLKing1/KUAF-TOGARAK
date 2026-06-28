// src/pages/teacher/CourseDetailPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  getById,
  getCourseEnrollments,
  getUserData,
  updateDocument,
} from "../../firebase/firestore";

// ── Helpers ───────────────────────────────────────────────────────────────
const DAY_NAMES = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

const formatSchedule = (schedule) => {
  if (!schedule?.length) return "—";
  return schedule
    .map((s) => `${DAY_NAMES[s.dayOfWeek] ?? "?"} ${s.startTime}–${s.endTime}`)
    .join(", ");
};

const toDateKey = (dateStr) => {
  // Normalize to YYYY-MM-DD string key
  return dateStr; // already string from <input type="date">
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "numeric" });
};

const today = () => new Date().toISOString().split("T")[0];

const STATUS_OPTIONS = [
  { value: "present", label: "✅ Bor", color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  { value: "absent",  label: "❌ Yo'q", color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  { value: "late",    label: "⏰ Kechikkan", color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
];

// ── Tabs ──────────────────────────────────────────────────────────────────
const TABS = ["Talabalar", "Davomat", "Baholar"];

// ── Sub-Components ────────────────────────────────────────────────────────
const InfoChip = ({ icon, label }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 13, color: "#94a3b8",
    background: "#0f172a", border: "1px solid #1e293b",
    borderRadius: 8, padding: "5px 12px",
  }}>
    <span>{icon}</span> {label}
  </span>
);

const TableHeader = ({ cols }) => (
  <thead>
    <tr>
      {cols.map((c) => (
        <th key={c} style={{
          textAlign: "left", padding: "10px 14px",
          fontSize: 11, fontWeight: 700, color: "#64748b",
          textTransform: "uppercase", letterSpacing: "0.06em",
          background: "#0f172a", borderBottom: "1px solid #1e293b",
        }}>
          {c}
        </th>
      ))}
    </tr>
  </thead>
);

// ── Main Page ─────────────────────────────────────────────────────────────
const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]); // [{id, studentId, attendance, grades, ...}]
  const [students, setStudents] = useState({});        // {uid: {fullName, email, ...}}
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Davomat
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [attendanceMap, setAttendanceMap] = useState({}); // {enrollmentId: "present"|"absent"|"late"}
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Baholar
  const [gradeLabel, setGradeLabel] = useState("");
  const [gradeDate, setGradeDate] = useState(today());
  const [gradeMap, setGradeMap] = useState({});    // {enrollmentId: {grade, comment}}
  const [savingGrades, setSavingGrades] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState(0);
  // History
  const [expandedStudent, setExpandedStudent] = useState(null);

  // ── Load data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const courseData = await getById("courses", courseId);
      if (!courseData) { navigate("/teacher/dashboard"); return; }
      if (courseData.teacherId !== currentUser?.uid) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      setCourse(courseData);

      // Enrollments (bulk load)
      const enrollData = await getCourseEnrollments(courseId);
      setEnrollments(enrollData);

      // Student info (parallel)
      const studentIds = [...new Set(enrollData.map((e) => e.studentId))];
      const studentEntries = await Promise.all(
        studentIds.map(async (uid) => {
          const u = await getUserData(uid);
          return [uid, u];
        })
      );
      setStudents(Object.fromEntries(studentEntries));
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  }, [courseId, currentUser?.uid, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Davomat: date o'zgarganda mavjud davomat yuklash ──────────────────
  useEffect(() => {
    const map = {};
    enrollments.forEach((enr) => {
      const rec = enr.attendance?.find((a) => a.date === attendanceDate);
      if (rec) map[enr.id] = rec.status;
    });
    setAttendanceMap(map);
  }, [attendanceDate, enrollments]);

  // ── Baholar: date o'zgarganda mavjud baholar yuklash ──────────────────
  useEffect(() => {
    const map = {};
    enrollments.forEach((enr) => {
      const rec = enr.grades?.find((g) => g.date === gradeDate && (gradeLabel ? g.label === gradeLabel : true));
      if (rec) map[enr.id] = { grade: rec.grade ?? "", comment: rec.comment ?? "" };
    });
    setGradeMap(map);
  }, [gradeDate, gradeLabel, enrollments]);

  // ── Save Attendance ────────────────────────────────────────────────────
  const saveAttendance = async () => {
    if (!attendanceDate) { toast.error("Sana tanlanmagan"); return; }
    setSavingAttendance(true);
    try {
      await Promise.all(
        enrollments.map(async (enr) => {
          const status = attendanceMap[enr.id];
          if (!status) return;
          const existing = enr.attendance || [];
          // Upsert: agar shu sana uchun yozuv bo'lsa yangilash
          const updated = existing.filter((a) => a.date !== attendanceDate);
          updated.push({ date: attendanceDate, status });
          await updateDocument("enrollments", enr.id, { attendance: updated });
          // Local state yangilash
          enr.attendance = updated;
        })
      );
      setEnrollments([...enrollments]);
      toast.success("Davomat saqlandi ✓");
    } catch (err) {
      console.error(err);
      toast.error("Saqlashda xato yuz berdi");
    } finally {
      setSavingAttendance(false);
    }
  };

  // ── Save Grades ────────────────────────────────────────────────────────
  const saveGrades = async () => {
    if (!gradeDate) { toast.error("Sana tanlanmagan"); return; }
    setSavingGrades(true);
    try {
      await Promise.all(
        enrollments.map(async (enr) => {
          const entry = gradeMap[enr.id];
          if (!entry || entry.grade === "" || entry.grade === undefined) return;
          const gradeNum = Number(entry.grade);
          if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) return;
          const existing = enr.grades || [];
          // Upsert by date+label
          const updated = existing.filter(
            (g) => !(g.date === gradeDate && (gradeLabel ? g.label === gradeLabel : !g.label))
          );
          updated.push({
            date: gradeDate,
            label: gradeLabel || null,
            grade: gradeNum,
            comment: entry.comment || "",
          });
          await updateDocument("enrollments", enr.id, { grades: updated });
          enr.grades = updated;
        })
      );
      setEnrollments([...enrollments]);
      toast.success("Baholar saqlandi ✓");
    } catch (err) {
      console.error(err);
      toast.error("Saqlashda xato yuz berdi");
    } finally {
      setSavingGrades(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────
  const getStudentStats = (enr) => {
    const att = enr.attendance || [];
    const presentCount = att.filter((a) => a.status === "present").length;
    const lateCount = att.filter((a) => a.status === "late").length;
    const total = att.length;
    const attendancePct = total > 0 ? Math.round(((presentCount + lateCount * 0.5) / total) * 100) : null;

    const grades = enr.grades || [];
    const avgGrade =
      grades.length > 0
        ? Math.round(grades.reduce((s, g) => s + (g.grade ?? 0), 0) / grades.length)
        : null;

    return { att, grades, presentCount, lateCount, total, attendancePct, avgGrade };
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div style={{ color: "#64748b", fontSize: 15 }}>Yuklanmoqda...</div>
    </div>
  );

  if (unauthorized) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🚫</div>
      <h2 style={{ color: "#f87171", margin: "0 0 12px" }}>Ruxsat yo'q</h2>
      <p style={{ color: "#64748b" }}>Bu kursga kirish huquqingiz yo'q.</p>
      <button onClick={() => navigate("/teacher/dashboard")} style={{ marginTop: 20, padding: "10px 24px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" }}>
        Dashboard ga qaytish
      </button>
    </div>
  );

  if (!course) return null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Back */}
      <button onClick={() => navigate("/teacher/dashboard")}
        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
        ← Orqaga
      </button>

      {/* Course Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #162032 100%)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 20,
        padding: "28px 32px",
        marginBottom: 28,
        position: "relative",
        overflow: "hidden",
        animation: "fadeIn 0.4s ease both",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", background: "rgba(99,102,241,0.15)", borderRadius: 6, padding: "2px 8px" }}>
                {course.subject}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: course.isActive ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                color: course.isActive ? "#34d399" : "#64748b",
              }}>
                {course.isActive ? "✓ Faol" : "Nofaol"}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, marginBottom: 16 }}>
              {course.title}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <InfoChip icon="🕐" label={formatSchedule(course.schedule)} />
              <InfoChip icon="🏫" label={course.roomName || "Xona ko'rsatilmagan"} />
              <InfoChip icon="👥" label={`${course.enrolledCount ?? 0} / ${course.capacity} talaba`} />
            </div>
          </div>
          <button
            id="edit-course-btn"
            onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
            style={{
              padding: "10px 20px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 10,
              color: "#a5b4fc",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✏ Tahrirlash
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#1e293b", borderRadius: 12, padding: 4 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase().replace(/\s/g, "-")}`}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              padding: "10px",
              background: activeTab === i ? "#334155" : "transparent",
              border: "none",
              borderRadius: 9,
              color: activeTab === i ? "#f1f5f9" : "#64748b",
              fontSize: 14,
              fontWeight: activeTab === i ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Talabalar ── */}
      {activeTab === 0 && (
        <div style={{ background: "#1e293b", borderRadius: 16, overflow: "hidden", border: "1px solid #1e293b", animation: "fadeIn 0.3s ease both" }}>
          {enrollments.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <p>Bu kursga hali talaba yozilmagan.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <TableHeader cols={["Ism Familiya", "Email", "Yozilgan sana", "Davomat %", "O'rt. baho", "Tarix"]} />
              <tbody>
                {enrollments.map((enr) => {
                  const st = students[enr.studentId];
                  const { attendancePct, avgGrade, att, grades } = getStudentStats(enr);
                  const isExpanded = expandedStudent === enr.id;
                  return (
                    <>
                      <tr
                        key={enr.id}
                        style={{ borderBottom: "1px solid #0f172a", cursor: "pointer" }}
                        onClick={() => setExpandedStudent(isExpanded ? null : enr.id)}
                      >
                        <td style={{ padding: "13px 14px", fontSize: 14, color: "#f1f5f9" }}>
                          {st?.fullName || "Noma'lum"}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 13, color: "#64748b" }}>
                          {st?.email || enr.studentId}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 13, color: "#64748b" }}>
                          {enr.enrolledAt?.toDate
                            ? enr.enrolledAt.toDate().toLocaleDateString("uz-UZ")
                            : "—"}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          {attendancePct !== null ? (
                            <span style={{ fontSize: 13, fontWeight: 600, color: attendancePct >= 80 ? "#34d399" : attendancePct >= 60 ? "#fbbf24" : "#f87171" }}>
                              {attendancePct}%
                            </span>
                          ) : <span style={{ color: "#475569", fontSize: 13 }}>—</span>}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          {avgGrade !== null ? (
                            <span style={{ fontSize: 13, fontWeight: 600, color: avgGrade >= 70 ? "#34d399" : avgGrade >= 50 ? "#fbbf24" : "#f87171" }}>
                              {avgGrade}
                            </span>
                          ) : <span style={{ color: "#475569", fontSize: 13 }}>—</span>}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 12, color: "#6366f1" }}>{isExpanded ? "▲ Yopish" : "▼ Ko'rish"}</span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${enr.id}-expanded`} style={{ background: "#0f172a" }}>
                          <td colSpan={6} style={{ padding: "20px 20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                              {/* Davomat tarixi */}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 10 }}>
                                  Davomat tarixi
                                </div>
                                {att.length === 0 ? (
                                  <p style={{ color: "#475569", fontSize: 13 }}>Hali davomat yo'q</p>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
                                    {att.slice().sort((a, b) => a.date < b.date ? 1 : -1).map((a, i) => {
                                      const st2 = STATUS_OPTIONS.find((s) => s.value === a.status);
                                      return (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 10px", background: st2?.bg, borderRadius: 6, border: `1px solid ${st2?.border}` }}>
                                          <span style={{ color: "#94a3b8" }}>{formatDateDisplay(a.date)}</span>
                                          <span style={{ color: st2?.color, fontWeight: 600 }}>{st2?.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              {/* Baholar tarixi */}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 10 }}>
                                  Baholar tarixi
                                </div>
                                {grades.length === 0 ? (
                                  <p style={{ color: "#475569", fontSize: 13 }}>Hali baho yo'q</p>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
                                    {grades.slice().sort((a, b) => a.date < b.date ? 1 : -1).map((g, i) => (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "5px 10px", background: "rgba(99,102,241,0.08)", borderRadius: 6, border: "1px solid rgba(99,102,241,0.15)" }}>
                                        <div>
                                          <span style={{ color: "#94a3b8" }}>{formatDateDisplay(g.date)}</span>
                                          {g.label && <span style={{ color: "#64748b", marginLeft: 6 }}>({g.label})</span>}
                                          {g.comment && <div style={{ color: "#64748b", marginTop: 2 }}>{g.comment}</div>}
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: 15, color: g.grade >= 70 ? "#34d399" : g.grade >= 50 ? "#fbbf24" : "#f87171" }}>
                                          {g.grade}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tab 1: Davomat ── */}
      {activeTab === 1 && (
        <div style={{ animation: "fadeIn 0.3s ease both" }}>
          <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, border: "1px solid #1e293b", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Sana tanlang</label>
                <input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ padding: "9px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none" }}
                />
              </div>
              <div style={{ marginTop: 20 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  {Object.keys(attendanceMap).length}/{enrollments.length} ta belgilangan
                </span>
              </div>
            </div>

            {enrollments.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Bu kursga hali talaba yozilmagan.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {enrollments.map((enr) => {
                  const st = students[enr.studentId];
                  const current = attendanceMap[enr.id];
                  return (
                    <div key={enr.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", background: "#0f172a", borderRadius: 12,
                      border: "1px solid #1e293b", flexWrap: "wrap", gap: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>
                          {st?.fullName || "Noma'lum"}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{st?.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            id={`att-${enr.id}-${opt.value}`}
                            onClick={() => setAttendanceMap((prev) => ({ ...prev, [enr.id]: opt.value }))}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 8,
                              border: `1px solid ${current === opt.value ? opt.border : "rgba(255,255,255,0.05)"}`,
                              background: current === opt.value ? opt.bg : "transparent",
                              color: current === opt.value ? opt.color : "#475569",
                              fontSize: 12,
                              fontWeight: current === opt.value ? 700 : 400,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {enrollments.length > 0 && (
            <button
              id="save-attendance-btn"
              onClick={saveAttendance}
              disabled={savingAttendance}
              style={{
                padding: "13px 32px",
                background: savingAttendance ? "#334155" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: savingAttendance ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              {savingAttendance ? "Saqlanmoqda..." : "✓ Davomatni saqlash"}
            </button>
          )}
        </div>
      )}

      {/* ── Tab 2: Baholar ── */}
      {activeTab === 2 && (
        <div style={{ animation: "fadeIn 0.3s ease both" }}>
          <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, border: "1px solid #1e293b", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Sana</label>
                <input
                  id="grade-date"
                  type="date"
                  value={gradeDate}
                  onChange={(e) => setGradeDate(e.target.value)}
                  style={{ padding: "9px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
                  Baho nomi (ixtiyoriy)
                </label>
                <input
                  id="grade-label"
                  type="text"
                  value={gradeLabel}
                  onChange={(e) => setGradeLabel(e.target.value)}
                  placeholder="Masalan: 1-nazorat ishi"
                  style={{ padding: "9px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none", width: 220 }}
                />
              </div>
            </div>

            {enrollments.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Bu kursga hali talaba yozilmagan.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {enrollments.map((enr) => {
                  const st = students[enr.studentId];
                  const entry = gradeMap[enr.id] || { grade: "", comment: "" };
                  return (
                    <div key={enr.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", background: "#0f172a", borderRadius: 12,
                      border: "1px solid #1e293b", flexWrap: "wrap", gap: 12,
                    }}>
                      <div style={{ minWidth: 160 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>
                          {st?.fullName || "Noma'lum"}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{st?.email}</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <input
                          id={`grade-${enr.id}`}
                          type="number"
                          min={0}
                          max={100}
                          value={entry.grade}
                          placeholder="0–100"
                          onChange={(e) =>
                            setGradeMap((prev) => ({ ...prev, [enr.id]: { ...prev[enr.id], grade: e.target.value } }))
                          }
                          style={{ width: 80, padding: "8px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 14, outline: "none", textAlign: "center" }}
                        />
                        <input
                          id={`comment-${enr.id}`}
                          type="text"
                          value={entry.comment}
                          placeholder="Izoh (ixtiyoriy)"
                          onChange={(e) =>
                            setGradeMap((prev) => ({ ...prev, [enr.id]: { ...prev[enr.id], comment: e.target.value } }))
                          }
                          style={{ flex: 1, minWidth: 140, padding: "8px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 14, outline: "none" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {enrollments.length > 0 && (
            <button
              id="save-grades-btn"
              onClick={saveGrades}
              disabled={savingGrades}
              style={{
                padding: "13px 32px",
                background: savingGrades ? "#334155" : "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: savingGrades ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
              }}
            >
              {savingGrades ? "Saqlanmoqda..." : "✓ Baholarni saqlash"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
