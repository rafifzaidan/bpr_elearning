"use client";

import { useState, useEffect } from "react";
import { getExams, getModules, createExam, updateExam } from "@/lib/actions";
import ConfirmationDialog from "../components/ConfirmationDialog";

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Aktif");
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, action: () => void, message: string}>({isOpen: false, action: () => {}, message: ""});

  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [e, m] = await Promise.all([getExams(), getModules()]);
      setExams(e);
      setModules(m);
    } catch (error) {
      console.error("Error loading exam data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = exams.filter((e) => {
    const now = new Date();
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    
    if (activeTab === "Aktif") return now >= start && now <= end;
    if (activeTab === "Mendatang") return now < start;
    if (activeTab === "Selesai") return now > end;
    return true;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createExam(formData);
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateExam(editExam.id, formData);
      setEditExam(null);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCloseCreateModal() {
    if (isSubmitting) return;
    setConfirmDialog({
      isOpen: true,
      action: () => { setShowModal(false); setConfirmDialog(prev => ({...prev, isOpen: false})); },
      message: "Yakin ingin keluar? Data yang sudah diisi akan hilang."
    });
  }

  function handleCloseEditModal() {
    if (isSubmitting) return;
    setConfirmDialog({
      isOpen: true,
      action: () => { setEditExam(null); setConfirmDialog(prev => ({...prev, isOpen: false})); },
      message: "Yakin ingin keluar? Perubahan yang belum disimpan akan hilang."
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jadwal Ujian</h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur waktu pelaksanaan ujian per modul
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Jadwalkan Ujian
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {["Aktif", "Mendatang", "Selesai"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Exam Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-medium text-slate-500">Nama Ujian</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Modul</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Waktu Mulai</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Waktu Selesai</th>
                <th className="text-center px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-6 py-3 font-medium text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Memuat data ujian...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Tidak ada ujian dalam kategori ini.</td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const now = new Date();
                  const start = new Date(e.start_date);
                  const end = new Date(e.end_date);
                  let status = "Aktif";
                  let statusColor = "bg-emerald-50 text-emerald-700";
                  
                  if (now < start) {
                    status = "Mendatang";
                    statusColor = "bg-blue-50 text-blue-700";
                  } else if (now > end) {
                    status = "Selesai";
                    statusColor = "bg-slate-100 text-slate-500";
                  }

                  return (
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 font-medium text-slate-900">{e.title}</td>
                      <td className="px-6 py-3.5 text-slate-600">{e.module.title}</td>
                      <td className="px-6 py-3.5 text-slate-500">{new Date(e.start_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-6 py-3.5 text-slate-500">{new Date(e.end_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right relative">
                        <button 
                          onClick={() => setShowDropdown(showDropdown === e.id ? null : e.id)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                          </svg>
                        </button>
                        {showDropdown === e.id && (
                          <div className="absolute right-10 top-8 w-32 bg-white rounded-xl shadow-lg border border-slate-100 z-10 py-1">
                            <button
                              onClick={() => {
                                setEditExam(e);
                                setShowDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Edit Jadwal
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseCreateModal} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Jadwalkan Ujian</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Ujian</label>
                <input required name="title" type="text" placeholder="Contoh: Ujian Akhir Modul TI" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Modul</label>
                <select required name="moduleId" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none cursor-pointer">
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Waktu Mulai</label>
                  <input required name="startDate" type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Waktu Selesai</label>
                  <input required name="endDate" type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button disabled={isSubmitting} type="button" onClick={handleCloseCreateModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                Batal
              </button>
              <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg cursor-pointer">
                {isSubmitting ? "Menyimpan..." : "Buat Jadwal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseEditModal} />
          <form onSubmit={handleEditSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Edit Jadwal Ujian</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Ujian</label>
                <input required name="title" defaultValue={editExam.title} type="text" placeholder="Contoh: Ujian Akhir Modul TI" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Modul</label>
                <select required name="moduleId" defaultValue={editExam.module_id} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none cursor-pointer">
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Waktu Mulai</label>
                  <input required name="startDate" defaultValue={formatDateTimeLocal(editExam.start_date)} type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Waktu Selesai</label>
                  <input required name="endDate" defaultValue={formatDateTimeLocal(editExam.end_date)} type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button disabled={isSubmitting} type="button" onClick={handleCloseEditModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                Batal
              </button>
              <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg cursor-pointer">
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Dialog for Exiting Modal */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title="Konfirmasi"
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
      />
    </div>
  );
}
