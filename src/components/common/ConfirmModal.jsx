import Modal from "./Modal";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "O'chirish", isDestructive = true }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-slate-300">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors ${
              isDestructive ? "bg-red-500 hover:bg-red-600" : "bg-indigo-500 hover:bg-indigo-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
