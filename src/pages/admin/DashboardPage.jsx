import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// Skeleton loader uchun
const StatSkeleton = () => (
  <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl animate-pulse">
    <div className="flex justify-between items-start">
      <div>
        <div className="h-3 w-24 bg-slate-700 rounded mb-3" />
        <div className="h-8 w-12 bg-slate-700 rounded" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-700" />
    </div>
  </div>
);

const PIE_COLORS = ["#6366f1", "#22d3ee", "#a78bfa", "#f59e0b", "#10b981", "#f87171"];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [topCourses, setTopCourses] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "users")),
        ]);

        const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const users = usersSnap.docs.map(d => d.data());

        const totalCourses = courses.length;
        const activeCourses = courses.filter(c => c.isActive).length;
        const totalStudents = users.filter(u => u.role === "student").length;
        const totalTeachers = users.filter(u => u.role === "teacher").length;

        setStats({ totalCourses, activeCourses, totalStudents, totalTeachers });

        // Top 5 kurs (eng ko'p talaba)
        const sorted = [...courses]
          .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
          .slice(0, 5)
          .map(c => ({ name: c.title.length > 20 ? c.title.slice(0, 18) + "…" : c.title, talabalar: c.enrolledCount || 0 }));
        setTopCourses(sorted);

        // Fanlar bo'yicha taqsimot
        const subjectMap = {};
        courses.forEach(c => {
          const sub = c.subject || "Boshqa";
          subjectMap[sub] = (subjectMap[sub] || 0) + 1;
        });
        setSubjectData(Object.entries(subjectMap).map(([name, value]) => ({ name, value })));
      } catch (err) {
        console.error("Dashboard stats xato:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Jami kurslar",
      value: stats?.totalCourses ?? "—",
      icon: "📚",
      color: "indigo",
      path: "/admin/courses",
    },
    {
      label: "Faol kurslar",
      value: stats?.activeCourses ?? "—",
      icon: "🔥",
      color: "amber",
      path: "/admin/courses",
    },
    {
      label: "Jami talabalar",
      value: stats?.totalStudents ?? "—",
      icon: "🎓",
      color: "blue",
      path: "/admin/students",
    },
    {
      label: "Jami o'qituvchilar",
      value: stats?.totalTeachers ?? "—",
      icon: "👨‍🏫",
      color: "emerald",
      path: "/admin/teachers",
    },
  ];

  const colorMap = {
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "hover:border-indigo-500/50" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "hover:border-amber-500/50" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "hover:border-blue-500/50" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "hover:border-emerald-500/50" },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Umumiy statistika</h1>
        <p className="text-slate-400 text-sm mt-1">Platformadagi asosiy ko'rsatkichlar</p>
      </div>

      {/* Statistika kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((card) => {
              const c = colorMap[card.color];
              return (
                <Link
                  key={card.label}
                  to={card.path}
                  className={`bg-slate-800/80 backdrop-blur border border-slate-700 ${c.border} p-6 rounded-2xl transition-all duration-200 group`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">{card.label}</p>
                      <h3 className="text-3xl font-bold text-white mt-2 group-hover:scale-110 transition-transform origin-left">
                        {card.value}
                      </h3>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-xl`}>
                      {card.icon}
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Grafiklar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — top 5 kurs */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl">
          <h3 className="text-slate-200 font-semibold mb-4">Top 5 kurs (talabalar soni)</h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-full h-full bg-slate-700/40 rounded-xl animate-pulse" />
            </div>
          ) : topCourses.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              Kurslar yo'q
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topCourses} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "#f1f5f9",
                  }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                />
                <Bar dataKey="talabalar" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — fanlar bo'yicha */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl">
          <h3 className="text-slate-200 font-semibold mb-4">Fanlar bo'yicha kurslar taqsimoti</h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-full h-full bg-slate-700/40 rounded-xl animate-pulse" />
            </div>
          ) : subjectData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              Kurslar yo'q
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {subjectData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "#f1f5f9",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
