"use client";

import { useState, useEffect } from "react";
import { getExams, getModules, createExam, updateExam, deleteExam } from "@/lib/actions";
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

      {/* Exam Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Memuat data ujian...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
          Tidak ada ujian dalam kategori ini. Klik "Jadwal Ujian" untuk membuat baru.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((e) => {
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
              <div key={e.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between">
                <div>
                  {e.module?.image_url && (
                    <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-slate-100">
                      <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/modules/${e.module.image_url}`} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
                      {status.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditExam(e)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit Jadwal">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.14l-2.815.939.94-2.815a4.5 4.5 0 011.14-1.89l8.931-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          action: async () => {
                            try {
                              await deleteExam(e.id);
                              loadData();
                            } catch (err: any) {
                              alert(err.message);
                            } finally {
                              setConfirmDialog(prev => ({...prev, isOpen: false}));
                            }
                          },
                          message: `Apakah Anda yakin ingin menghapus jadwal ujian "${e.title}"?`
                        });
                      }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Jadwal">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {e.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-slate-600 font-medium">Modul: {e.module?.title}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Mulai:</span>
                    <span className="font-medium text-slate-700">{new Date(e.start_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Selesai:</span>
                    <span className="font-medium text-slate-700">{new Date(e.end_date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Durasi:</span>
                    {e.duration_minutes
                      ? <span className="inline-flex items-center gap-1 font-semibold text-slate-700">⏱ {e.duration_minutes} menit</span>
                      : <span className="text-slate-400 text-xs">Sampai deadline</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              <input type="hidden" name="questionSetName" value="Default" />
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ⏱ Durasi Pengerjaan (menit)
                  <span className="ml-1 text-xs font-normal text-slate-400">— opsional, kosongkan jika sampai deadline</span>
                </label>
                <input
                  name="durationMinutes"
                  type="number"
                  min="1"
                  max="300"
                  placeholder="Contoh: 90"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
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
              <input type="hidden" name="questionSetName" value="Default" />
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  ⏱ Durasi Pengerjaan (menit)
                  <span className="ml-1 text-xs font-normal text-slate-400">— opsional, kosongkan jika sampai deadline</span>
                </label>
                <input
                  name="durationMinutes"
                  type="number"
                  min="1"
                  max="300"
                  defaultValue={editExam.duration_minutes ?? ""}
                  placeholder="Contoh: 90"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
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
