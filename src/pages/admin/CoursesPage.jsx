const CoursesPage = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Kurslar (To'garaklar)</h1>
          <p className="text-slate-400 text-sm mt-1">Platformadagi barcha o'quv kurslari</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
          + Yangi kurs
        </button>
      </div>
      
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl text-center">
        <p className="text-slate-400">🚧 Kurslar boshqaruvi navbatdagi bosqichda to'ldiriladi</p>
      </div>
    </div>
  );
};

export default CoursesPage;
