// src/pages/admin/DashboardPage.jsx
const DashboardPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Umumiy statistika</h1>
        <p className="text-slate-400 text-sm mt-1">Platformadagi asosiy ko'rsatkichlar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Jami kurslar */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl hover:border-indigo-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Jami kurslar</p>
              <h3 className="text-3xl font-bold text-white mt-2">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl">
              📚
            </div>
          </div>
        </div>

        {/* Jami talabalar */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl hover:border-blue-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Jami talabalar</p>
              <h3 className="text-3xl font-bold text-white mt-2">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
              🎓
            </div>
          </div>
        </div>

        {/* Jami o'qituvchilar */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Jami o'qituvchilar</p>
              <h3 className="text-3xl font-bold text-white mt-2">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
              👨‍🏫
            </div>
          </div>
        </div>

        {/* Faol to'garaklar */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl hover:border-amber-500/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Faol to'garaklar</p>
              <h3 className="text-3xl font-bold text-white mt-2">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
              🔥
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
