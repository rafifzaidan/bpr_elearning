"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardClientProps {
  stats: {
    totalUsers: number;
    totalModules: number;
    activeExams: number;
    avgScore: string;
    divisionDistribution: { name: string; value: number }[];
  };
  recentResults: any[];
}

export default function DashboardClient({ stats, recentResults }: DashboardClientProps) {
  // Mock data for charts (since I don't have enough history in DB yet)
  const monthlyScores = [
    { month: "Jan", avgScore: 72 },
    { month: "Feb", avgScore: 75 },
    { month: "Mar", avgScore: 78 },
    { month: "Apr", avgScore: parseFloat(stats.avgScore) || 74 },
  ];

  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];
  const divisionData = stats.divisionDistribution.map((d, i) => ({
    name: d.name,
    value: d.value,
    color: colors[i % colors.length],
  }));

  const statCards = [
    { label: "Total Pegawai", value: stats.totalUsers, icon: "👥", color: "from-blue-500 to-blue-600" },
    { label: "Total Modul", value: stats.totalModules, icon: "📚", color: "from-emerald-500 to-emerald-600" },
    { label: "Ujian Aktif", value: stats.activeExams, icon: "📝", color: "from-purple-500 to-purple-600" },
    { label: "Rata-rata Skor", value: stats.avgScore, icon: "📊", color: "from-amber-500 to-amber-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan performa e-learning BPR Jatim secara LIVE
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Performa Bulanan</h2>
          <div className="h-[280px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Distribusi Divisi</h2>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={divisionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {divisionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {divisionData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-medium text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Hasil Ujian Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500">
                <th className="text-left px-6 py-3 font-medium">Pegawai</th>
                <th className="text-left px-6 py-3 font-medium">Ujian</th>
                <th className="text-center px-6 py-3 font-medium">Skor</th>
                <th className="text-center px-6 py-3 font-medium">Status</th>
                <th className="text-right px-6 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Belum ada hasil ujian.</td></tr>
              ) : (
                recentResults.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{r.user.full_name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{r.exam.title}</td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-900">{r.score}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.is_passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {r.is_passed ? "LULUS" : "TIDAK LULUS"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-400">
                      {new Date(r.finished_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
