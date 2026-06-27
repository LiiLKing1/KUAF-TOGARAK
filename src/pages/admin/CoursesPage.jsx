import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { collection, onSnapshot, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { addDocument, updateDocument, deleteDocument } from "../../firebase/firestore";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      schedule: [{ day: "Dushanba", startTime: "15:00", endTime: "16:30" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedule"
  });

  // Ma'lumotlarni yuklash
  useEffect(() => {
    // 1. O'qituvchilar va Xonalarni yuklash (faqat bir marta form uchun kerak)
    const fetchSelectData = async () => {
      try {
        const teachersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
        const roomsSnap = await getDocs(collection(db, "rooms"));
        
        setTeachers(teachersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setRooms(roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Select ma'lumotlarini yuklashda xato:", error);
      }
    };
    fetchSelectData();

    // 2. Kurslarni real-time yuklash
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingCourse(null);
    reset({
      title: "",
      description: "",
      subject: "",
      teacherId: "",
      roomId: "",
      capacity: "",
      startDate: "",
      schedule: [{ day: "Dushanba", startTime: "15:00", endTime: "16:30" }]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    reset({
      title: course.title,
      description: course.description,
      subject: course.subject,
      teacherId: course.teacherId,
      roomId: course.roomId,
      capacity: course.capacity,
      startDate: course.startDate,
      schedule: course.schedule || []
    });
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setCourseToDelete(null);
    setEditingCourse(null);
  };

  const toggleStatus = async (course) => {
    try {
      await updateDocument("courses", course.id, { isActive: !course.isActive });
      toast.success(course.isActive ? "Kurs to'xtatildi" : "Kurs faollashtirildi");
    } catch (error) {
      toast.error("Holatni o'zgartirib bo'lmadi");
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Teacher va Room ismlarini topish (denormalization uchun)
      const selectedTeacher = teachers.find(t => t.id === data.teacherId);
      const selectedRoom = rooms.find(r => r.id === data.roomId);

      const courseData = {
        title: data.title,
        description: data.description,
        subject: data.subject,
        teacherId: data.teacherId,
        teacherName: selectedTeacher ? selectedTeacher.fullName : "Noma'lum",
        roomId: data.roomId,
        roomName: selectedRoom ? selectedRoom.name : "Noma'lum",
        capacity: Number(data.capacity),
        startDate: data.startDate,
        schedule: data.schedule,
      };

      if (editingCourse) {
        await updateDocument("courses", editingCourse.id, courseData);
        toast.success("Kurs muvaffaqiyatli yangilandi");
      } else {
        // Yangi kurs
        courseData.enrolledCount = 0;
        courseData.isActive = true;
        await addDocument("courses", courseData);
        toast.success("Yangi kurs qo'shildi");
      }
      closeModals();
    } catch (error) {
      console.error("Saqlashda xato:", error);
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    try {
      await deleteDocument("courses", courseToDelete.id);
      toast.success("Kurs o'chirildi");
      closeModals();
    } catch (error) {
      toast.error("Kursni o'chirib bo'lmadi");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Kurslar (To'garaklar)</h1>
          <p className="text-slate-400 text-sm mt-1">Platformadagi barcha o'quv kurslari</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <span>+ Yangi kurs</span>
        </button>
      </div>

      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Kurslar yuklanmoqda...</div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium text-slate-200 mb-1">Hozircha kurslar yo'q</h3>
            <button onClick={openAddModal} className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
              + Kurs qo'shish
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Kurs nomi / Fan</th>
                  <th className="px-6 py-4 font-medium">O'qituvchi</th>
                  <th className="px-6 py-4 font-medium">Xona</th>
                  <th className="px-6 py-4 font-medium">Talabalar</th>
                  <th className="px-6 py-4 font-medium text-center">Holati</th>
                  <th className="px-6 py-4 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/courses/${course.id}`} className="font-medium text-indigo-400 hover:text-indigo-300">
                        {course.title}
                      </Link>
                      <div className="text-xs text-slate-500 mt-1">{course.subject}</div>
                    </td>
                    <td className="px-6 py-4">{course.teacherName}</td>
                    <td className="px-6 py-4">{course.roomName}</td>
                    <td className="px-6 py-4">
                      {course.enrolledCount} / {course.capacity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleStatus(course)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                          course.isActive 
                            ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20" 
                            : "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                        }`}
                        title="Holatni o'zgartirish"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${course.isActive ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                        {course.isActive ? "Faol" : "To'xtatilgan"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/admin/courses/${course.id}`}
                        className="inline-block p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                        title="Batafsil"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => openEditModal(course)}
                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Tahrirlash"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(course)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModals} 
        title={editingCourse ? "Kursni tahrirlash" : "Yangi kurs yaratish"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Kurs nomi</label>
            <input
              type="text"
              placeholder="Masalan: Web dasturlash asoslari"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              {...register("title", { required: "Kiritish shart" })}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Fan nomi</label>
            <input
              type="text"
              placeholder="Masalan: IT"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              {...register("subject", { required: "Kiritish shart" })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tavsifi</label>
            <textarea
              rows={3}
              placeholder="Kurs haqida qisqacha ma'lumot"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none resize-none"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">O'qituvchi</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                {...register("teacherId", { required: "Tanlash shart" })}
              >
                <option value="">Tanlang...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.subject})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Xona</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                {...register("roomId", { required: "Tanlash shart" })}
              >
                <option value="">Tanlang...</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.capacity} kishi)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Sig'im (talaba soni max)</label>
              <input
                type="number"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                {...register("capacity", { required: "Kiritish shart" })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Boshlanish sanasi</label>
              <input
                type="date"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                {...register("startDate", { required: "Kiritish shart" })}
              />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-300">Dars jadvali</label>
              <button 
                type="button"
                onClick={() => append({ day: "Dushanba", startTime: "15:00", endTime: "16:30" })}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                + Kun qo'shish
              </button>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <select
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-500 w-1/3"
                    {...register(`schedule.${index}.day`)}
                  >
                    <option value="Dushanba">Dushanba</option>
                    <option value="Seshanba">Seshanba</option>
                    <option value="Chorshanba">Chorshanba</option>
                    <option value="Payshanba">Payshanba</option>
                    <option value="Juma">Juma</option>
                    <option value="Shanba">Shanba</option>
                    <option value="Yakshanba">Yakshanba</option>
                  </select>
                  <input
                    type="time"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-500 w-1/3"
                    {...register(`schedule.${index}.startTime`)}
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-500 w-1/3"
                    {...register(`schedule.${index}.endTime`)}
                  />
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-300 px-1">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-slate-800 pb-2 border-t border-slate-700 mt-4">
            <button
              type="button"
              onClick={closeModals}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Kursni o'chirish"
        message={<><strong>{courseToDelete?.title}</strong> kursini o'chirishga ishonchingiz komilmi? Agar bu kursga talabalar yozilgan bo'lsa ham, u o'chib ketadi!</>}
      />
    </div>
  );
};

export default CoursesPage;
