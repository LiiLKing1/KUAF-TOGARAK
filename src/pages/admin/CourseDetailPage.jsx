import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

const CourseDetailPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kurs ma'lumotlari
    const courseUnsub = onSnapshot(doc(db, "courses", id), (docSnap) => {
      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() });
      }
      setIsLoading(false);
    });

    // Bu kursga yozilgan talabalar
    const enrollmentsQuery = query(
      collection(db, "enrollments"),
      where("courseId", "==", id)
    );
    const enrollmentsUnsub = onSnapshot(enrollmentsQuery, (snapshot) => {
      setEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      courseUnsub();
      enrollmentsUnsub();
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Kurs topilmadi</p>
        <Link to="/admin/courses" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">← Kurslarga qaytish</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/admin/courses" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kurslarga qaytish
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">{course.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{course.subject}</p>
        </div>
        <span className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
          course.isActive
            ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
            : "text-amber-400 bg-amber-400/10 border border-amber-400/20"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${course.isActive ? "bg-emerald-400" : "bg-amber-400"}`}></span>
          {course.isActive ? "Faol" : "To'xtatilgan"}
        </span>
      </div>

      {/* Kurs haqida to'liq ma'lumot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">O'qituvchi</p>
          <p className="text-slate-200 font-medium text-lg">👨‍🏫 {course.teacherName}</p>
        </div>
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Xona</p>
          <p className="text-slate-200 font-medium text-lg">🚪 {course.roomName}</p>
        </div>
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Talabalar</p>
          <p className="text-slate-200 font-medium text-lg">🎓 {course.enrolledCount} / {course.capacity}</p>
        </div>
      </div>

      {/* Jadval */}
      {course.schedule && course.schedule.length > 0 && (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
          <h3 className="text-slate-300 font-medium mb-3">📅 Dars jadvali</h3>
          <div className="flex flex-wrap gap-2">
            {course.schedule.map((s, i) => (
              <div key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-300">
                <span className="font-medium">{s.day}</span>
                <span className="text-indigo-400/60 mx-1">|</span>
                {s.startTime} – {s.endTime}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tavsif */}
      {course.description && (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl">
          <h3 className="text-slate-300 font-medium mb-2">Tavsif</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{course.description}</p>
        </div>
      )}

      {/* Yozilgan talabalar jadvali */}
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-slate-200 font-semibold">Yozilgan talabalar</h3>
          <span className="text-slate-400 text-sm">{enrollments.length} nafar</span>
        </div>
        {enrollments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 text-sm">Bu kursga hali talaba yozilmagan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 font-medium">Talaba ismi</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium text-center">Davomat</th>
                  <th className="px-6 py-3 font-medium text-center">O'rtacha baho</th>
                  <th className="px-6 py-3 font-medium">Qo'shilgan sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {enrollments.map((enrollment) => {
                  const attendanceCount = enrollment.attendance?.filter(a => a.present)?.length || 0;
                  const totalAttendance = enrollment.attendance?.length || 0;
                  const grades = enrollment.grades || [];
                  const avgGrade = grades.length > 0
                    ? (grades.reduce((sum, g) => sum + g.grade, 0) / grades.length).toFixed(1)
                    : "—";

                  return (
                    <tr key={enrollment.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {enrollment.studentName || "Noma'lum"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{enrollment.studentEmail}</td>
                      <td className="px-6 py-4 text-center">
                        {totalAttendance > 0 ? (
                          <span className={`text-sm font-medium ${
                            attendanceCount / totalAttendance > 0.7 ? "text-emerald-400" : "text-amber-400"
                          }`}>
                            {attendanceCount}/{totalAttendance}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${
                          avgGrade !== "—" && parseFloat(avgGrade) >= 70
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}>
                          {avgGrade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {enrollment.enrolledAt?.toDate
                          ? enrollment.enrolledAt.toDate().toLocaleDateString("uz-UZ")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
