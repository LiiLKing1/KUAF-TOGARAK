import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { createTeacherAccount, deleteTeacherAccount } from "../../firebase/functions";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Muvaffaqiyatli yaratilgandan keyin ko'rsatiladigan ma'lumot
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // Firestore'dan real-time o'qituvchilarni olish
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "teacher"),
    );
    
    // orderBy ishlatganda composite index kerak bo'lishi mumkin, 
    // shuning uchun client-side sort ishlatamiz yoki faqat where
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teachersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by createdAt client-side to avoid needing an index right away
      teachersData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setTeachers(teachersData);
      setIsLoading(false);
    }, (error) => {
      console.error("O'qituvchilarni olishda xato:", error);
      toast.error("O'qituvchilarni yuklab bo'lmadi");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("password", password);
    toast.success("Yangi parol generatsiya qilindi!");
  };

  const openAddModal = () => {
    reset({ fullName: "", email: "", subject: "", password: "" });
    setIsAddModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsDeleteModalOpen(false);
    setTeacherToDelete(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Cloud Function chaqirish
      await createTeacherAccount({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        subject: data.subject
      });
      
      toast.success("Yangi o'qituvchi muvaffaqiyatli qo'shildi");
      setCreatedCredentials({ email: data.email, password: data.password, name: data.fullName });
      closeModals();
    } catch (error) {
      console.error("Yaratishda xato:", error);
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteTeacherAccount({ teacherUid: teacherToDelete.id });
      toast.success("O'qituvchi o'chirildi");
      closeModals();
    } catch (error) {
      console.error("O'chirishda xato:", error);
      toast.error(error.message || "O'qituvchini o'chirib bo'lmadi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(`Login: ${createdCredentials.email}\nParol: ${createdCredentials.password}`);
      toast.success("Nusxalandi!");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">O'qituvchilar</h1>
          <p className="text-slate-400 text-sm mt-1">Platformadagi barcha o'qituvchilar</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <span>+ Yangi o'qituvchi</span>
        </button>
      </div>

      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-3">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            O'qituvchilar yuklanmoqda...
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              👨‍🏫
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-1">Hozircha o'qituvchilar qo'shilmagan</h3>
            <p className="text-slate-400 text-sm mb-4">Tizimga o'qituvchi qo'shish uchun "Yangi o'qituvchi" tugmasini bosing</p>
            <button onClick={openAddModal} className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
              + O'qituvchi qo'shish
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-medium">F.I.SH.</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Mutaxassisligi (Fan)</th>
                  <th className="px-6 py-4 font-medium text-center">Holati</th>
                  <th className="px-6 py-4 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{teacher.fullName}</td>
                    <td className="px-6 py-4 text-slate-400">{teacher.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium">
                        {teacher.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {teacher.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-emerald-400 bg-emerald-400/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-red-400 bg-red-400/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Nofaol
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => confirmDelete(teacher)}
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

      {/* Qo'shish modali */}
      <Modal isOpen={isAddModalOpen} onClose={closeModals} title="Yangi o'qituvchi yaratish">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">F.I.SH.</label>
            <input
              type="text"
              placeholder="To'liq ism"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              {...register("fullName", { required: "Ismni kiritish shart" })}
            />
            {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              placeholder="example@mail.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              {...register("email", { 
                required: "Emailni kiritish shart",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Noto'g'ri email format" }
              })}
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mutaxassisligi (Fan nomi)</label>
            <input
              type="text"
              placeholder="Masalan: Matematika"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              {...register("subject", { required: "Mutaxassislikni kiritish shart" })}
            />
            {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between items-center">
              <span>Vaqtinchalik parol</span>
              <button 
                type="button" 
                onClick={generatePassword}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Parol yaratish
              </button>
            </label>
            <input
              type="text"
              placeholder="Parol"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              {...register("password", { 
                required: "Parolni kiritish shart",
                minLength: { value: 6, message: "Parol kamida 6ta belgi bo'lishi kerak" }
              })}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Yaratilmoqda...
                </>
              ) : "Yaratish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* O'chirishni tasdiqlash modali */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="O'qituvchini o'chirish"
        message={<>Siz rostdan ham <strong>{teacherToDelete?.fullName}</strong>ni o'chirmoqchimisiz? Agar bu o'qituvchining kurslari bo'lsa, avval ularni boshqaga o'tkazing!</>}
        confirmText={isSubmitting ? "O'chirilmoqda..." : "Ha, o'chirish"}
      />

      {/* Muvaffaqiyatli yaratilgandan keyingi Credentials Modali */}
      <Modal 
        isOpen={!!createdCredentials} 
        onClose={() => setCreatedCredentials(null)}
        title="Hisob muvaffaqiyatli yaratildi!"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            Quyidagi ma'lumotlarni o'qituvchiga (<strong>{createdCredentials?.name}</strong>) yetkazing. Ular orqali tizimga kirishlari mumkin:
          </p>
          
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl relative group">
            <p className="text-sm font-medium text-slate-400 mb-1">Login (Email):</p>
            <p className="text-slate-100 mb-3 select-all">{createdCredentials?.email}</p>
            
            <p className="text-sm font-medium text-slate-400 mb-1">Parol:</p>
            <p className="text-slate-100 select-all font-mono tracking-wider">{createdCredentials?.password}</p>
            
            <button 
              onClick={copyCredentials}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
              title="Nusxa olish"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setCreatedCredentials(null)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Tushunarli, yopish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeachersPage;
