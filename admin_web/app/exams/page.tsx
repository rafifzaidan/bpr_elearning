"use client";

import { useState, useEffect } from "react";
import { 
  getExams, 
  getModules, 
  createExam, 
  updateExam, 
  deleteExam,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from "@/lib/actions";
import ConfirmationDialog from "../components/ConfirmationDialog";

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchModuleQuery, setSearchModuleQuery] = useState("");
  
  // Navigation states
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<"ujian" | "soal">("ujian");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // Modal states - Exams
  const [showExamModal, setShowExamModal] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);

  // Modal states - Questions
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editQuestion, setEditQuestion] = useState<any>(null);

  const [notification, setNotification] = useState<{message: string, type: "success" | "error"} | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: () => void;
    message: string;
  }>({
    isOpen: false,
    action: () => {},
    message: ""
  });

  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function loadData() {
    setLoading(true);
    try {
      const [e, m, q] = await Promise.all([getExams(), getModules(), getQuestions()]);
      setExams(e);
      setModules(m);
      setQuestions(q);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const moduleExams = exams.filter((e) => e.module_id === selectedModuleId);
  const moduleQuestions = questions.filter((q) => q.module_id === selectedModuleId);

  // Active exam selection
  const activeExam = moduleExams.find(e => e.id === selectedExamId) || moduleExams[0];
  const activeExamQuestions = activeExam 
    ? moduleQuestions.filter(q => q.set_name === activeExam.question_set_name)
    : [];

  // Filtered modules for selection grid
  const filteredModules = modules.filter((m) =>
    m.title.toLowerCase().includes(searchModuleQuery.toLowerCase())
  );

  // Submit functions for Exams
  async function handleExamSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("moduleId", String(selectedModuleId));
      await createExam(formData);
      setShowExamModal(false);
      setNotification({ message: "Jadwal ujian baru berhasil dibuat!", type: "success" });
      loadData();
    } catch (error: any) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExamEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("moduleId", String(selectedModuleId));
      await updateExam(editExam.id, formData);
      setEditExam(null);
      setNotification({ message: "Jadwal ujian berhasil diperbarui!", type: "success" });
      loadData();
    } catch (error: any) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit functions for Questions
  async function handleQuestionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("moduleId", String(selectedModuleId));
      await createQuestion(formData);
      setShowQuestionModal(false);
      setNotification({ message: "Pertanyaan baru berhasil ditambahkan!", type: "success" });
      loadData();
    } catch (error: any) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuestionEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("moduleId", String(selectedModuleId));
      await updateQuestion(editQuestion.id, formData);
      setEditQuestion(null);
      setNotification({ message: "Pertanyaan berhasil diperbarui!", type: "success" });
      loadData();
    } catch (error: any) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirmation dialog triggers
  function handleCloseExamCreateModal() {
    if (isSubmitting) return;
    setConfirmDialog({
      isOpen: true,
      action: () => { setShowExamModal(false); setConfirmDialog(prev => ({...prev, isOpen: false})); },
      message: "Yakin ingin keluar? Data yang sudah diisi akan hilang."
    });
  }

  function handleCloseExamEditModal() {
    if (isSubmitting) return;
    setConfirmDialog({
      isOpen: true,
      action: () => { setEditExam(null); setConfirmDialog(prev => ({...prev, isOpen: false})); },
      message: "Yakin ingin keluar? Perubahan yang belum disimpan akan hilang."
    });
  }

  function handleCloseQuestionCreateModal() {
    if (isSubmitting) return;
    setConfirmDialog({
      isOpen: true,
      action: () => { setShowQuestionModal(false); setConfirmDialog(prev => ({...prev, isOpen: false})); },
      message: "Yakin ingin keluar? Data yang sudah diisi akan hilang."
    });
  }

  function handleCloseQuestionEditModal() {
    if (isSubmitting) return;
    setConfirmDialog({
      isOpen: true,
      action: () => { setEditQuestion(null); setConfirmDialog(prev => ({...prev, isOpen: false})); },
      message: "Yakin ingin keluar? Perubahan yang belum disimpan akan hilang."
    });
  }

  // RENDER SELECT MODULE SCREEN
  if (selectedModuleId === null) {
    return (
      <div className="space-y-6">
        {/* Success/Error Modal Dialog */}
        {notification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Background Overlay */}
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
              onClick={() => setNotification(null)} 
            />
            
            {/* Dialog Box */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  notification.type === "success" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  {notification.type === "success" ? (
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                
                {/* Text Content */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {notification.type === "success" ? "Berhasil" : "Gagal"}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="w-full pt-4">
                  <button
                    type="button"
                    onClick={() => setNotification(null)}
                    className={`w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all cursor-pointer ${
                      notification.type === "success" 
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" 
                        : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Kuis & Bank Soal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pilih modul pelatihan di bawah ini untuk mengatur jadwal ujian dan daftar pertanyaan.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Cari modul..."
            value={searchModuleQuery}
            onChange={(e) => setSearchModuleQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Memuat modul...</div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
            Tidak ada modul yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredModules.map((m) => {
              const examCount = exams.filter((e) => e.module_id === m.id).length;
              const questionCount = m._count?.questions ?? 0;

              return (
                <div 
                  key={m.id}
                  onClick={() => {
                    setSelectedModuleId(m.id);
                    setDetailTab("ujian");
                  }}
                  className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {m.image_url ? (
                      <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-slate-100">
                        <img 
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/modules/${m.image_url}`} 
                          alt={m.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 mb-4 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                      {m.description || "Tidak ada deskripsi."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700">
                      📋 {examCount} Ujian
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700">
                      📝 {questionCount} Soal
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // RENDER SELECTED MODULE DETAIL MANAGER (EXAMS + BANK SOAL)
  return (
    <div className="space-y-6">
      {/* Success/Error Modal Dialog */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Background Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
            onClick={() => setNotification(null)} 
          />
          
          {/* Dialog Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                notification.type === "success" ? "bg-emerald-100" : "bg-red-100"
              }`}>
                {notification.type === "success" ? (
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              
              {/* Text Content */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {notification.type === "success" ? "Berhasil" : "Gagal"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {notification.message}
                </p>
              </div>
              
              {/* Actions */}
              <div className="w-full pt-4">
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className={`w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all cursor-pointer ${
                    notification.type === "success" 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" 
                      : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Breadcrumbs & Header */}
      <div>
        <button
          onClick={() => setSelectedModuleId(null)}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mb-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Daftar Modul
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{selectedModule?.title}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola jadwal pelaksanaan ujian dan bank soal untuk modul ini.
        </p>
      </div>

      {/* Tab Switcher & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 gap-4">
        <div className="flex">
          <button
            onClick={() => setDetailTab("ujian")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              detailTab === "ujian" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📋 Jadwal Ujian ({moduleExams.length})
          </button>
          <button
            onClick={() => setDetailTab("soal")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              detailTab === "soal" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            📝 Bank Soal ({activeExam ? activeExamQuestions.length : 0})
          </button>
        </div>

        {/* Action Button depending on Active Tab */}
        <div className="pb-2">
          {detailTab === "ujian" ? (
            <button
              onClick={() => setShowExamModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Jadwalkan Ujian
            </button>
          ) : activeExam ? (
            <button
              onClick={() => setShowQuestionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Pertanyaan
            </button>
          ) : null}
        </div>
      </div>

      {detailTab === "ujian" && (
        <div>
          {loading ? (
            <div className="text-center py-20 text-slate-400">Memuat data ujian...</div>
          ) : moduleExams.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
              Tidak ada ujian yang dijadwalkan untuk modul ini. Klik "Jadwalkan Ujian" untuk membuat baru.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {moduleExams.map((e) => {
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
                                  setNotification({ message: `Jadwal ujian "${e.title}" berhasil dihapus!`, type: "success" });
                                  loadData();
                                } catch (err: any) {
                                  setNotification({ message: err.message, type: "error" });
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
                      {e.can_retake && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-2">
                          🔄 Bisa Dikerjakan Ulang
                        </span>
                      )}
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
        </div>
      )}

      {/* TAB CONTENT: BANK SOAL */}
      {detailTab === "soal" && (
        <div>
          {loading ? (
            <div className="text-center py-20 text-slate-400">Memuat soal...</div>
          ) : moduleExams.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
              Belum ada jadwal ujian untuk modul ini. Silakan buat jadwal ujian terlebih dahulu di tab "Jadwal Ujian" sebelum mengelola pertanyaan.
            </div>
          ) : (
            <div>
              {/* Sleek selector dropdown for exams */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-6 max-w-xl">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Pilih Jadwal Ujian:</span>
                </div>
                <select
                  value={activeExam?.id ?? ""}
                  onChange={(e) => setSelectedExamId(Number(e.target.value))}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {moduleExams.map((exam) => {
                    const count = questions.filter(q => q.module_id === selectedModuleId && q.set_name === exam.question_set_name).length;
                    return (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({count} Soal)
                      </option>
                    );
                  })}
                </select>
              </div>

              {activeExamQuestions.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border border-slate-100 rounded-3xl text-slate-500">
                  Belum ada pertanyaan untuk jadwal ujian "{activeExam?.title}". Klik "Tambah Pertanyaan" untuk membuat baru.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeExamQuestions.map((q, idx) => (
                    <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditQuestion(q)}
                            className="text-slate-400 hover:text-blue-500 transition-colors p-1.5 cursor-pointer"
                            title="Edit Pertanyaan"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.14l-2.815.939.94-2.815a4.5 4.5 0 011.14-1.89l8.931-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button 
                            onClick={async () => {
                              setConfirmDialog({
                                isOpen: true,
                                action: async () => {
                                  try {
                                    await deleteQuestion(q.id);
                                    setNotification({ message: "Pertanyaan berhasil dihapus!", type: "success" });
                                    loadData();
                                  } catch (err: any) {
                                    setNotification({ message: err.message, type: "error" });
                                  } finally {
                                    setConfirmDialog(prev => ({...prev, isOpen: false}));
                                  }
                                },
                                message: "Apakah Anda yakin ingin menghapus pertanyaan ini?"
                              });
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 cursor-pointer"
                            title="Hapus Pertanyaan"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <h3 className="text-slate-900 font-medium whitespace-pre-wrap">{q.text}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(q.options as Record<string, string>).map(([key, val]) => (
                          <div key={key} className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${q.correct_ans === key ? "border-emerald-500 bg-emerald-50/50" : "border-slate-100 bg-slate-50/30"}`}>
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${q.correct_ans === key ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                              {key}
                            </span>
                            <span className={q.correct_ans === key ? "text-emerald-900 font-medium" : "text-slate-600"}>{val}</span>
                            {q.correct_ans === key && (
                              <svg className="w-4 h-4 text-emerald-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SCHEDULE EXAM */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseExamCreateModal} />
          <form onSubmit={handleExamSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Jadwalkan Ujian</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Ujian</label>
                <input required name="title" type="text" placeholder="Contoh: Ujian Akhir Modul TI" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
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

              {/* Retake Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="canRetake"
                  name="canRetake"
                  value="true"
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="canRetake" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                  Bisa dikerjakan ulang? (User dapat mengulangi ujian berkali-kali)
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button disabled={isSubmitting} type="button" onClick={handleCloseExamCreateModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                Batal
              </button>
              <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg cursor-pointer">
                {isSubmitting ? "Menyimpan..." : "Buat Jadwal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT EXAM SCHEDULE */}
      {editExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseExamEditModal} />
          <form onSubmit={handleExamEditSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Edit Jadwal Ujian</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Ujian</label>
                <input required name="title" defaultValue={editExam.title} type="text" placeholder="Contoh: Ujian Akhir Modul TI" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
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

              {/* Retake Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="canRetakeEdit"
                  name="canRetake"
                  value="true"
                  defaultChecked={editExam.can_retake}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="canRetakeEdit" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                  Bisa dikerjakan ulang? (User dapat mengulangi ujian berkali-kali)
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button disabled={isSubmitting} type="button" onClick={handleCloseExamEditModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                  Batal
                </button>
                <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg cursor-pointer">
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* MODAL: ADD QUESTION */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseQuestionCreateModal} />
          <form onSubmit={handleQuestionSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Tambah Pertanyaan — {activeExam?.title}</h2>
            
            <div className="space-y-4">
              <input type="hidden" name="setName" value={activeExam?.question_set_name || "Default"} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pertanyaan</label>
                <textarea required name="text" rows={3} placeholder="Tulis soal di sini..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Pilihan Jawaban</label>
                {["A", "B", "C", "D"].map((opt) => (
                  <div key={opt} className="flex gap-3 items-center">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{opt}</span>
                    <input required name={`option${opt}`} type="text" placeholder={`Isi pilihan ${opt}...`} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Jawaban Benar</label>
                <div className="flex gap-4">
                  {["A", "B", "C", "D"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input required type="radio" name="correctAns" value={opt} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button disabled={isSubmitting} type="button" onClick={handleCloseQuestionCreateModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                Batal
              </button>
              <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg cursor-pointer transition-all">
                {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT QUESTION */}
      {editQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseQuestionEditModal} />
          <form onSubmit={handleQuestionEditSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Edit Pertanyaan</h2>
            
            <div className="space-y-4">
              <input type="hidden" name="setName" value={editQuestion.set_name || "Default"} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pertanyaan</label>
                <textarea required name="text" defaultValue={editQuestion.text} rows={3} placeholder="Tulis soal di sini..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Pilihan Jawaban</label>
                {["A", "B", "C", "D"].map((opt) => (
                  <div key={opt} className="flex gap-3 items-center">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{opt}</span>
                    <input required name={`option${opt}`} defaultValue={editQuestion.options?.[opt] || ""} type="text" placeholder={`Isi pilihan ${opt}...`} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Jawaban Benar</label>
                <div className="flex gap-4">
                  {["A", "B", "C", "D"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input required type="radio" name="correctAns" value={opt} defaultChecked={editQuestion.correct_ans === opt} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button disabled={isSubmitting} type="button" onClick={handleCloseQuestionEditModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                Batal
              </button>
              <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg cursor-pointer transition-all">
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Dialog */}
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
