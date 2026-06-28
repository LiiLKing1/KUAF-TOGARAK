// src/pages/teacher/EditCoursePage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getById, getAll, updateDocument } from "../../firebase/firestore";

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

const FormField = ({ label, error, children, hint }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={labelStyle}>{label}</label>
    {children}
    {hint && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b" }}>{hint}</p>}
    {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#f87171" }}>{error}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ margin: "28px 0 16px" }}>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#a5b4fc" }}>{children}</h3>
    <div style={{ height: 1, background: "rgba(99,102,241,0.2)", marginTop: 10 }} />
  </div>
);

const EditCoursePage = () => {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const { fields, append, remove } = useFieldArray({ control, name: "schedule" });

  const watchedCapacity = watch("capacity");

  // Load course + rooms
  useEffect(() => {
    (async () => {
      try {
        const [courseData, roomsData] = await Promise.all([
          getById("courses", courseId),
          getAll("rooms"),
        ]);

        if (!courseData) { navigate("/teacher/dashboard"); return; }
        if (courseData.teacherId !== currentUser?.uid) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setRooms(roomsData);
        setEnrolledCount(courseData.enrolledCount ?? 0);

        // Pre-fill form
        const startDateStr = courseData.startDate?.toDate
          ? courseData.startDate.toDate().toISOString().split("T")[0]
          : courseData.startDate || "";

        reset({
          title: courseData.title || "",
          description: courseData.description || "",
          subject: courseData.subject || "",
          roomId: courseData.roomId || "",
          startDate: startDateStr,
          capacity: courseData.capacity || "",
          isActive: courseData.isActive ?? true,
          schedule: (courseData.schedule || []).map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      } catch (err) {
        console.error(err);
        toast.error("Kursni yuklashda xato");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, currentUser?.uid, navigate, reset]);

  const onSubmit = async (data) => {
    // Capacity validation vs enrolledCount
    if (Number(data.capacity) < enrolledCount) {
      toast.error(`Sig'im ${enrolledCount} tadan kam bo'lmasligi kerak (hozir ${enrolledCount} talaba yozilgan)`);
      return;
    }
    setSaving(true);
    try {
      const selectedRoom = rooms.find((r) => r.id === data.roomId);
      const updates = {
        title: data.title.trim(),
        description: data.description.trim(),
        subject: data.subject.trim(),
        roomId: data.roomId,
        roomName: selectedRoom?.name || "",
        schedule: data.schedule.map((s) => ({
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        startDate: new Date(data.startDate),
        capacity: Number(data.capacity),
        isActive: data.isActive === true || data.isActive === "true",
        updatedAt: new Date(),
      };
      await updateDocument("courses", courseId, updates);
      toast.success("Kurs muvaffaqiyatli yangilandi ✓");
      navigate(`/teacher/courses/${courseId}`);
    } catch (err) {
      console.error(err);
      toast.error("Saqlashda xato: " + (err.message || "Noma'lum xato"));
    } finally {
      setSaving(false);
    }
  };

  // Render: unauthorized
  if (unauthorized) return (
    <div style={{ textAlign: "center", padding: 80 }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🚫</div>
      <h2 style={{ color: "#f87171", margin: "0 0 12px" }}>Ruxsat yo'q</h2>
      <p style={{ color: "#64748b" }}>Bu kursni tahrirlashga ruxsatingiz yo'q.</p>
      <button onClick={() => navigate("/teacher/dashboard")} style={{ marginTop: 20, padding: "10px 24px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>
        Dashboard ga qaytish
      </button>
    </div>
  );

  // Render: loading
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div style={{ color: "#64748b" }}>Yuklanmoqda...</div>
    </div>
  );

  const capacityNum = Number(watchedCapacity);
  const capacityWarning =
    !isNaN(capacityNum) && capacityNum > 0 && capacityNum < enrolledCount
      ? `⚠ Hozir ${enrolledCount} talaba yozilgan, sig'imni shundan kichik qilib bo'lmaydi`
      : null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
        >
          ← Orqaga
        </button>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
          Kursni tahrirlash
        </h1>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
          Kurs ma'lumotlarini yangilang
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
        {/* Asosiy */}
        <SectionTitle>📋 Asosiy ma'lumotlar</SectionTitle>

        <FormField label="To'garak sarlavhasi *" error={errors.title?.message}>
          <input
            id="edit-course-title"
            {...register("title", { required: "Sarlavha kiritilishi shart" })}
            style={{ ...inputStyle, borderColor: errors.title ? "#ef4444" : "#334155" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = errors.title ? "#ef4444" : "#334155")}
          />
        </FormField>

        <FormField label="Fan nomi *" error={errors.subject?.message}>
          <input
            id="edit-course-subject"
            {...register("subject", { required: "Fan nomi kiritilishi shart" })}
            style={{ ...inputStyle, borderColor: errors.subject ? "#ef4444" : "#334155" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = errors.subject ? "#ef4444" : "#334155")}
          />
        </FormField>

        <FormField label="Tavsif">
          <textarea
            id="edit-course-description"
            {...register("description")}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#334155")}
          />
        </FormField>

        {/* Holat */}
        <FormField label="Kurs holati">
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { value: true, label: "✓ Faol", color: "#34d399", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
              { value: false, label: "✗ Nofaol", color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.2)" },
            ].map((opt) => {
              const isSelected = String(watch("isActive")) === String(opt.value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    // manually set value — react-hook-form Controller alternative
                    const el = document.querySelector(`[data-isactive="${opt.value}"]`);
                    if (el) el.click();
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: isSelected ? opt.bg : "transparent",
                    border: `1px solid ${isSelected ? opt.border : "#334155"}`,
                    borderRadius: 10,
                    color: isSelected ? opt.color : "#64748b",
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                  <input
                    type="radio"
                    data-isactive={opt.value}
                    {...register("isActive")}
                    value={String(opt.value)}
                    style={{ display: "none" }}
                  />
                </button>
              );
            })}
          </div>
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
              <select id={`edit-schedule-day-${index}`} {...register(`schedule.${index}.dayOfWeek`)} style={{ ...inputStyle, cursor: "pointer" }}>
                {DAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={labelStyle}>Boshlanish</label>
              <input id={`edit-schedule-start-${index}`} type="time" {...register(`schedule.${index}.startTime`, { required: true })} style={inputStyle} />
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label style={labelStyle}>Tugash</label>
              <input id={`edit-schedule-end-${index}`} type="time" {...register(`schedule.${index}.endTime`, { required: true })} style={inputStyle} />
            </div>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", cursor: "pointer", padding: "10px 14px", fontSize: 13 }}>
                O'chir
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          id="edit-add-schedule-btn"
          onClick={() => append({ dayOfWeek: 1, startTime: "09:00", endTime: "10:30" })}
          style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)", borderRadius: 10, color: "#a5b4fc", cursor: "pointer", padding: "10px 18px", fontSize: 13, fontWeight: 500, width: "100%", marginBottom: 8 }}
        >
          ✚ Yana kun qo'shish
        </button>

        {/* Xona va sig'im */}
        <SectionTitle>🏫 Xona va sig'im</SectionTitle>

        <FormField label="Xona tanlash *" error={errors.roomId?.message}>
          <select
            id="edit-course-room"
            {...register("roomId", { required: "Xona tanlanishi shart" })}
            style={{ ...inputStyle, cursor: "pointer", borderColor: errors.roomId ? "#ef4444" : "#334155" }}
          >
            <option value="">— Xona tanlang —</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} {room.building ? `(${room.building})` : ""} — {room.capacity ?? "?"} o'rin
              </option>
            ))}
          </select>
        </FormField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FormField label="Boshlanish sanasi *" error={errors.startDate?.message}>
            <input
              id="edit-course-start-date"
              type="date"
              {...register("startDate", { required: "Sana kiritilishi shart" })}
              style={{ ...inputStyle, borderColor: errors.startDate ? "#ef4444" : "#334155" }}
            />
          </FormField>

          <FormField
            label={`Sig'im *`}
            error={errors.capacity?.message}
            hint={capacityWarning}
          >
            <input
              id="edit-course-capacity"
              type="number"
              min={1}
              {...register("capacity", {
                required: "Sig'im kiritilishi shart",
                min: { value: 1, message: "Kamida 1 ta o'rin bo'lishi kerak" },
              })}
              style={{ ...inputStyle, borderColor: capacityWarning ? "#f59e0b" : errors.capacity ? "#ef4444" : "#334155" }}
            />
          </FormField>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ flex: 1, padding: "13px", background: "rgba(100,116,139,0.1)", border: "1px solid #334155", borderRadius: 12, color: "#64748b", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Bekor qilish
          </button>
          <button
            id="edit-submit-btn"
            type="submit"
            disabled={saving}
            style={{
              flex: 2, padding: "13px",
              background: saving ? "#334155" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: saving ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saqlanmoqda..." : "✓ O'zgarishlarni saqlash"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCoursePage;
