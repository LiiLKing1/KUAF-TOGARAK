const StudentsPage = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Talabalar</h1>
          <p className="text-slate-400 text-sm mt-1">Ro'yxatdan o'tgan barcha talabalar</p>
        </div>
      </div>
      
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl text-center">
        <p className="text-slate-400">🚧 Talabalar ro'yxati navbatdagi bosqichda to'ldiriladi</p>
      </div>
    </div>
  );
};

export default StudentsPage;
