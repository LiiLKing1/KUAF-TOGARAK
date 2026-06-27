import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { addDocument, updateDocument, deleteDocument } from "../../firebase/firestore";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Firestore'dan real-time xonalarni olish
  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Xonalarni olishda xato:", error);
      toast.error("Xonalarni yuklab bo'lmadi");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    reset({ name: "", building: "", capacity: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    reset({ name: room.name, building: room.building, capacity: room.capacity });
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setRoomToDelete(null);
    setEditingRoom(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const roomData = {
        name: data.name,
        building: data.building,
        capacity: Number(data.capacity),
      };

      if (editingRoom) {
        await updateDocument("rooms", editingRoom.id, roomData);
        toast.success("Xona muvaffaqiyatli yangilandi");
      } else {
        await addDocument("rooms", roomData);
        toast.success("Yangi xona qo'shildi");
      }
      closeModals();
    } catch (error) {
      console.error("Saqlashda xato:", error);
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;
    try {
      await deleteDocument("rooms", roomToDelete.id);
      toast.success("Xona o'chirildi");
    } catch (error) {
      console.error("O'chirishda xato:", error);
      toast.error("Xonani o'chirib bo'lmadi");
    } finally {
      closeModals();
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Xonalar</h1>
          <p className="text-slate-400 text-sm mt-1">Barcha dars xonalari va ularning sig'imi</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <span>+ Yangi xona</span>
        </button>
      </div>

      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-3">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Xonalar yuklanmoqda...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              🚪
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-1">Hozircha xonalar qo'shilmagan</h3>
            <p className="text-slate-400 text-sm mb-4">Birinchi xonani qo'shish uchun "Yangi xona" tugmasini bosing</p>
            <button onClick={openAddModal} className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
              + Xona qo'shish
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-medium">Xona nomi</th>
                  <th className="px-6 py-4 font-medium">Bino</th>
                  <th className="px-6 py-4 font-medium text-center">Sig'imi</th>
                  <th className="px-6 py-4 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{room.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-700 rounded-lg text-xs font-medium text-slate-300">
                        {room.building}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-200 font-medium">{room.capacity}</span> kishi
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(room)}
                        className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Tahrirlash"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(room)}
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

      {/* Qo'shish / Tahrirlash modali */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModals}
        title={editingRoom ? "Xonani tahrirlash" : "Yangi xona qo'shish"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Xona nomi</label>
            <input
              type="text"
              placeholder="Masalan: 204-xona"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              {...register("name", { required: "Xona nomini kiritish shart" })}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Bino nomi</label>
            <input
              type="text"
              placeholder="Masalan: A-bino"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              {...register("building", { required: "Bino nomini kiritish shart" })}
            />
            {errors.building && <p className="text-red-400 text-xs mt-1">{errors.building.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Sig'imi (talabalar soni)</label>
            <input
              type="number"
              placeholder="30"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              {...register("capacity", { 
                required: "Sig'imini kiritish shart",
                min: { value: 1, message: "Sig'im 1 dan katta bo'lishi kerak" }
              })}
            />
            {errors.capacity && <p className="text-red-400 text-xs mt-1">{errors.capacity.message}</p>}
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
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </Modal>

      {/* O'chirishni tasdiqlash modali */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Xonani o'chirish"
        message={<>Siz rostdan ham <strong>{roomToDelete?.name}</strong>ni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</>}
        confirmText="Ha, o'chirish"
      />
    </div>
  );
};

export default RoomsPage;
