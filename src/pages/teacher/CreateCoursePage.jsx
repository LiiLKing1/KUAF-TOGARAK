// src/pages/teacher/CreateCoursePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getAll, addDocument, getDocumentsWhere } from "../../firebase/firestore";
import { serverTimestamp } from "../../firebase/firestore";

const DAY_OPTIONS = [
  { value: 1, label: "Dushanba" },
  { value: 2, label: "Seshanba" },
  { value: 3, label: "Chorshanba" },
  { value: 4, label: "Payshanba" },
  { value: 5, label: "Juma" },
  { value: 6, label: "Shanba" },
  { value: 0, label: "Yakshanba" },
];

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "#f1f5f9",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
  marginBottom: 6,
};

const FormField = ({ label, error, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={labelStyle}>{label}</label>
    {children}
    {error && (
      <p style={{ margin: "5px 0 0", fontSize: 12, color: "#f87171" }}>{error}</p>
    )}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ margin: "28px 0 16px" }}>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#a5b4fc" }}>
      {children}
    </h3>
    <div style={{ height: 1, background: "rgba(99,102,241,0.2)", marginTop: 10 }} />
  </div>
);

const CreateCoursePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomConflicts, setRoomConflicts] = useState([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      roomId: "",
      startDate: "",
      capacity: "",
      schedule: [{ dayOfWeek: 1, startTime: "09:00", endTime: "10:30" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "schedule" });

  const watchedRoomId = watch("roomId");
  const watchedSchedule = watch("schedule");

  // Load rooms
  useEffect(() => {
    (async () => {
      try {
        const data = await getAll("rooms");
        setRooms(data);
      } catch (err) {
        console.error("Xonalarni yuklashda xato:", err);
      }
    })();
  }, []);

  // Check room conflicts (bonus)
  useEffect(() => {
    if (!watchedRoomId || !watchedSchedule?.length) return;
    (async () => {
      try {
        const activeCourses = await getDocumentsWhere("courses", "roomId", "==", watchedRoomId);
        const conflicts = [];
        activeCourses
          .filter((c) => c.isActive)
          .forEach((course) => {
            course.schedule?.forEach((cs) => {
              watchedSchedule.forEach((ws) => {
                if (
                  Number(ws.dayOfWeek) === Number(cs.dayOfWeek) &&
                  ws.startTime < cs.endTime &&
                  ws.endTime > cs.startTime
                ) {
                  conflicts.push(
                    `"${course.title}" kursi bilan (${DAY_OPTIONS.find((d) => d.value === Number(cs.dayOfWeek))?.label} ${cs.startTime}–${cs.endTime})`
                  );
                }
              });
            });
          });
        setRoomConflicts([...new Set(conflicts)]);
      } catch (_) {
        // ignore
      }
    })();
  }, [watchedRoomId, watchedSchedule]);

  const onSubmit = async (data) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const selectedRoom = rooms.find((r) => r.id === data.roomId);
      const courseData = {
        title: data.title.trim(),
        description: data.description.trim(),
        subject: data.subject.trim(),
        teacherId: currentUser.uid,
        teacherName: currentUser.fullName || currentUser.displayName || "",
        roomId: data.roomId,
        roomName: selectedRoom?.name || "",
        schedule: data.schedule.map((s) => ({
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        startDate: new Date(data.startDate),
        capacity: Number(data.capacity),
        enrolledCount: 0,
        isActive: true,
        createdAt: serverTimestamp(),
      };

      await addDocument("courses", courseData);
      toast.success("Kurs muvaffaqiyatli yaratildi! 🎉");
      navigate("/teacher/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Xato yuz berdi: " + (err.message || "Noma'lum xato"));
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 14,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
          }}
        >
          ← Orqaga
        </button>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
          Yangi kurs yaratish
        </h1>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
          To'garak ma'lumotlarini kiriting
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          background: "#1e293b",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 20,
          padding: 32,
          animation: "fadeIn 0.4s ease both",
        }}
      >
        {/* Asosiy ma'lumotlar */}
        <SectionTitle>📋 Asosiy ma'lumotlar</SectionTitle>

        <FormField label="To'garak sarlavhasi *" error={errors.title?.message}>
          <input
            id="course-title"
            {...register("title", { required: "Sarlavha kiritilishi shart" })}
            placeholder="Masalan: Matematika olimpiadaga tayyorgarlik"
            style={{ ...inputStyle, borderColor: errors.title ? "#ef4444" : "#334155" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = errors.title ? "#ef4444" : "#334155")}
          />
        </FormField>

        <FormField label="Fan nomi *" error={errors.subject?.message}>
          <input
            id="course-subject"
            {...register("subject", { required: "Fan nomi kiritilishi shart" })}
            placeholder="Masalan: Matematika, Fizika, Ingliz tili"
            style={{ ...inputStyle, borderColor: errors.subject ? "#ef4444" : "#334155" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = errors.subject ? "#ef4444" : "#334155")}
          />
        </FormField>

        <FormField label="Tavsif" error={errors.description?.message}>
          <textarea
            id="course-description"
            {...register("description")}
            placeholder="To'garak haqida qisqacha ma'lumot..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 80,
            }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#334155")}
          />
        </FormField>

        {/* Jadval */}
        <SectionTitle>📅 Dars jadvali</SectionTitle>

        {fields.map((field, index) => (
          <div
            key={field.id}
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: "16px 18px",
              marginBottom: 12,
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ ...labelStyle, marginBottom: 6 }}>Hafta kuni</label>
              <select
                id={`schedule-day-${index}`}
                {...register(`schedule.${index}.dayOfWeek`)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={labelStyle}>Boshlanish</label>
              <input
                id={`schedule-start-${index}`}
                type="time"
                {...register(`schedule.${index}.startTime`, { required: true })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={labelStyle}>Tugash</label>
              <input
                id={`schedule-end-${index}`}
                type="time"
                {...register(`schedule.${index}.endTime`, { required: true })}
                style={inputStyle}
              />
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                  color: "#f87171",
                  cursor: "pointer",
                  padding: "10px 14px",
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
              >
                Oʻchir
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          id="add-schedule-btn"
          onClick={() => append({ dayOfWeek: 1, startTime: "09:00", endTime: "10:30" })}
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px dashed rgba(99,102,241,0.3)",
            borderRadius: 10,
            color: "#a5b4fc",
            cursor: "pointer",
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 500,
            width: "100%",
            marginBottom: 8,
          }}
        >
          ✚ Yana kun qo'shish
        </button>

        {/* Xona va sanalar */}
        <SectionTitle>🏫 Xona va sig'im</SectionTitle>

        <FormField label="Xona tanlash *" error={errors.roomId?.message}>
          <select
            id="course-room"
            {...register("roomId", { required: "Xona tanlanishi shart" })}
            style={{ ...inputStyle, borderColor: errors.roomId ? "#ef4444" : "#334155", cursor: "pointer" }}
          >
            <option value="">— Xona tanlang —</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} {room.building ? `(${room.building})` : ""} — {room.capacity ?? "?"} o'rin
              </option>
            ))}
          </select>
          {rooms.length === 0 && (
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b" }}>
              ⚠ Hali xonalar yo'q. Admin xona qo'shishi kerak.
            </p>
          )}
        </FormField>

        {/* Room conflict warning */}
        {roomConflicts.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 600, color: "#fbbf24", fontSize: 13, marginBottom: 6 }}>
              ⚠ Diqqat: Xona band bo'lishi mumkin!
            </div>
            {roomConflicts.map((c, i) => (
              <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                • {c}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FormField label="Boshlanish sanasi *" error={errors.startDate?.message}>
            <input
              id="course-start-date"
              type="date"
              min={today}
              {...register("startDate", { required: "Sana kiritilishi shart" })}
              style={{ ...inputStyle, borderColor: errors.startDate ? "#ef4444" : "#334155" }}
            />
          </FormField>

          <FormField label="Sig'im (o'rinlar soni) *" error={errors.capacity?.message}>
            <input
              id="course-capacity"
              type="number"
              min={1}
              {...register("capacity", {
                required: "Sig'im kiritilishi shart",
                min: { value: 1, message: "Kamida 1 ta o'rin bo'lishi kerak" },
              })}
              placeholder="20"
              style={{ ...inputStyle, borderColor: errors.capacity ? "#ef4444" : "#334155" }}
            />
          </FormField>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              padding: "13px",
              background: "rgba(100,116,139,0.1)",
              border: "1px solid #334155",
              borderRadius: 12,
              color: "#64748b",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Bekor qilish
          </button>
          <button
            id="submit-course-btn"
            type="submit"
            disabled={saving}
            style={{
              flex: 2,
              padding: "13px",
              background: saving
                ? "#334155"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: saving ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saqlanmoqda..." : "✓ Kursni yaratish"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCoursePage;
