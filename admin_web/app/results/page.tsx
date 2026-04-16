"use client";

import { useState, useEffect } from "react";
import { getResults } from "@/lib/actions";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterPassed, setFilterPassed] = useState("Semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const r = await getResults();
      setResults(r);
    } catch (error) {
      console.error("Error loading results data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = results.filter((r) => {
    const matchSearch =
      r.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.user.nip.includes(search);

    if (filterPassed === "Lulus") return r.is_passed && matchSearch;
    if (filterPassed === "Tidak Lulus") return !r.is_passed && matchSearch;
    return matchSearch;
  });

  const stats = {
    avg: results.length ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) : "0",
    passed: results.filter(r => r.is_passed).length,
    failed: results.filter(r => !r.is_passed).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hasil Ujian</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoring performa pegawai
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Rata-rata Skor</p>
          <p className="text-3xl font-bold text-slate-900">{stats.avg}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Lulus</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.passed}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Tidak Lulus</p>
          <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["Semua", "Lulus", "Tidak Lulus"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterPassed(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterPassed === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-medium text-slate-500">Pegawai</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">NIP</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Divisi</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Ujian</th>
                <th className="text-center px-6 py-3 font-medium text-slate-500">Skor</th>
                <th className="text-center px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Waktu Selesai</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Memuat data hasil...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Tidak ada data hasil ditemukan.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                          {r.user.full_name[0]}
                        </div>
                        <span className="font-medium text-slate-900">{r.user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{r.user.nip}</td>
                    <td className="px-6 py-3.5 text-slate-600 italic">IT Group</td> {/* TODO: Add division to join if needed */}
                    <td className="px-6 py-3.5 text-slate-700">{r.exam.title}</td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-900">{r.score}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-tight ${r.is_passed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {r.is_passed ? "LULUS" : "TIDAK LULUS"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-500">
                      {new Date(r.finished_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>  /
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
