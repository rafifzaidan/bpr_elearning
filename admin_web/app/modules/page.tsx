"use client";

import { useState, useEffect } from "react";
import { getModules, getDivisions, createModule } from "@/lib/actions";

export default function ModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [m, d] = await Promise.all([getModules(), getDivisions()]);
      setModules(m);
      setDivisions(d);
    } catch (error) {
      console.error("Error loading module data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createModule(formData);
      setShowModal(false);
      setSelectedFile(null);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modul Pembelajaran</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola materi belajar per divisi
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Modul
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Memuat modul...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
          Belum ada modul. Klik "Tambah Modul" untuk memulai.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((m) => (
            <div key={m.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${m.file_type === "pdf" ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600"}`}>
                  {m.file_type === "pdf" ? "📄 PDF" : "🎬 Video"}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                {m.title}
              </h3>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                {m.description || "Tidak ada deskripsi."}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                    {m._count.questions} soal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 0 1 8.716 6.747M12 3a9.015 9.015 0 0 0-8.716 6.747" />
                    </svg>
                    {m.division.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Tambah Modul Baru</h2>
              <p className="text-sm text-slate-500 mt-1">Upload materi PDF atau Video</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Modul</label>
                <input required name="title" type="text" placeholder="Contoh: Pengenalan Sistem Informasi" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Divisi</label>
                  <select required name="divisionId" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none cursor-pointer">
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe File</label>
                  <select required name="fileType" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none cursor-pointer">
                    <option value="pdf">📄 PDF</option>
                    <option value="video">🎬 Video</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
                <textarea name="description" rows={3} placeholder="Jelaskan isi materi singkat..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">File Materi</label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${selectedFile ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400'}`}>
                  <div className="space-y-1 text-center">
                    <svg className={`mx-auto h-12 w-12 ${selectedFile ? 'text-blue-500' : 'text-slate-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>{selectedFile ? 'Ganti file' : 'Upload a file'}</span>
                        <input name="file" type="file" className="sr-only" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      </label>
                      {!selectedFile && <p className="pl-1">or drag and drop</p>}
                    </div>
                    {selectedFile ? (
                      <p className="text-xs font-bold text-blue-600 mt-1 truncate max-w-[200px] mx-auto">
                        ✅ {selectedFile.name}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">PDF atau MP4 up to 50MB</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button disabled={isSubmitting} type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                Batal
              </button>
              <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
                {isSubmitting ? "Mengunggah..." : "Simpan Modul"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
