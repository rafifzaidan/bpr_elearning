"use client";

import { useState, useEffect } from "react";
import { getModules, getDivisions, createModule, updateModule, deleteModule } from "@/lib/actions";

export default function ModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [editingModule, setEditingModule] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<{ id: number; title: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: "pdf" | "video"; title: string } | null>(null);
  const [notification, setNotification] = useState<{message: string, type: "success" | "error"} | null>(null);

  const filteredModules = modules.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      const [m, d] = await Promise.all([getModules(), getDivisions()]);
      setModules(m);
      setDivisions(d);
    } catch (error) {
      console.error("Error loading module data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(moduleId: number, title: string) {
    setDeleteConfirmModule({ id: moduleId, title });
  }

  async function confirmDelete() {
    if (!deleteConfirmModule) return;
    const { id, title } = deleteConfirmModule;
    setDeleteConfirmModule(null);
    setLoading(true);
    try {
      await deleteModule(id);
      setNotification({ message: `Modul "${title}" berhasil dihapus!`, type: "success" });
      const m = await getModules();
      setModules(m);
    } catch (error: any) {
      setNotification({ message: `Gagal menghapus modul: ${error.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      // Collect selected divisions from checkboxes
      const selectedDivisions = Array.from(e.currentTarget.querySelectorAll('input[name="divisionIds"]:checked')).map((cb: any) => cb.value);
      if (selectedDivisions.length === 0) {
        throw new Error("Pilih setidaknya satu divisi!");
      }
      formData.set("divisionIds", JSON.stringify(selectedDivisions));

      if (editingModule) {
        await updateModule(editingModule.id, formData);
        setNotification({ message: "Modul pembelajaran berhasil diperbarui!", type: "success" });
      } else {
        await createModule(formData);
        setNotification({ message: "Modul pembelajaran baru berhasil ditambahkan!", type: "success" });
      }
      setShowModal(false);
      setEditingModule(null);
      setSelectedFile(null);
      setSelectedImage(null);
      loadData();
    } catch (error: any) {
      setNotification({ message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(m: any) {
    setEditingModule(m);
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingModule(null);
    setSelectedFile(null);
    setSelectedImage(null);
    setShowModal(true);
  }

  return (
    <div className="space-y-8">
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modul Pembelajaran</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola materi belajar per divisi
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Modul
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Cari modul..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Memuat modul...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
          Belum ada modul. Klik "Tambah Modul" untuk memulai.
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
          Tidak ada modul yang cocok dengan pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModules.map((m) => {
            const fileUrl = m.file_url
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/modules/${m.file_url}`
              : null;

            return (
              <div key={m.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                {m.image_url && (
                  <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-slate-100">
                    {fileUrl ? (
                      <button
                        onClick={() => setPreviewFile({ url: fileUrl, type: m.file_type as any, title: m.title })}
                        className="w-full h-full text-left focus:outline-none cursor-pointer"
                        type="button"
                      >
                        <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/modules/${m.image_url}`} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </button>
                    ) : (
                      <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/modules/${m.image_url}`} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  {fileUrl ? (
                    <button
                      onClick={() => setPreviewFile({ url: fileUrl, type: m.file_type as any, title: m.title })}
                      className="cursor-pointer focus:outline-none text-left"
                      type="button"
                    >
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-85 transition-opacity ${m.file_type === "pdf" ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600"}`}>
                        {m.file_type === "pdf" ? "📄 PDF" : "🎬 Video"}
                      </span>
                    </button>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${m.file_type === "pdf" ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600"}`}>
                      {m.file_type === "pdf" ? "📄 PDF" : "🎬 Video"}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {fileUrl && (
                      <button
                        onClick={() => setPreviewFile({ url: fileUrl, type: m.file_type as any, title: m.title })}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Lihat Materi"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.303 7.855 7.085 5 11.998 5c4.913 0 8.697 2.855 11.966 6.678.36.463.36 1.054 0 1.517-3.326 4.343-7.11 7.198-11.966 7.198-4.912 0-8.697-2.855-11.966-6.678z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    )}
                    <button onClick={() => openEditModal(m)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit Modul">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.14l-2.815.939.94-2.815a4.5 4.5 0 011.14-1.89l8.931-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(m.id, m.title)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Hapus Modul">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                {fileUrl ? (
                  <button
                    onClick={() => setPreviewFile({ url: fileUrl, type: m.file_type as any, title: m.title })}
                    className="hover:underline text-left block w-full focus:outline-none cursor-pointer"
                    type="button"
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {m.title}
                    </h3>
                  </button>
                ) : (
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {m.title}
                  </h3>
                )}
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
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 0 1 8.716 6.747M12 3a9.015 9.015 0 0 0-8.716 6.747" />
                      </svg>
                      {m.division_ids && m.division_ids.length > 0
                        ? m.division_ids.length === divisions.length
                          ? "Semuanya"
                          : m.division_ids.map((id: number) => divisions.find((d) => d.id === id)?.name).filter(Boolean).join(", ")
                        : "Semuanya"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{editingModule ? "Edit Modul" : "Tambah Modul Baru"}</h2>
              <p className="text-sm text-slate-500 mt-1">{editingModule ? "Ubah informasi materi" : "Upload materi PDF atau Video"}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Modul</label>
                <input required name="title" defaultValue={editingModule?.title} type="text" placeholder="Contoh: Pengenalan Sistem Informasi" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Divisi (Pilih Satu atau Lebih)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    {divisions.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="divisionIds"
                          value={d.id}
                          defaultChecked={editingModule ? editingModule.division_ids?.includes(d.id) : false}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors">{d.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipe File</label>
                  <select required name="fileType" defaultValue={editingModule?.file_type} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white outline-none cursor-pointer">
                    <option value="pdf">📄 PDF</option>
                    <option value="video">🎬 Video</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
                <textarea name="description" defaultValue={editingModule?.description} rows={3} placeholder="Jelaskan isi materi singkat..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" />
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
                        <span>{selectedFile ? 'Ganti file' : (editingModule?.file_url ? 'Ganti file (Opsional)' : 'Upload a file')}</span>
                        <input name="file" type="file" className="sr-only" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      </label>
                      {!selectedFile && <p className="pl-1">or drag and drop</p>}
                    </div>
                    {selectedFile ? (
                      <p className="text-xs font-bold text-blue-600 mt-1 truncate max-w-[200px] mx-auto">
                        ✅ {selectedFile.name}
                      </p>
                    ) : editingModule?.file_url ? (
                      <p className="text-xs text-slate-400">Biarkan kosong jika tidak ingin mengubah file</p>
                    ) : (
                      <p className="text-xs text-slate-400">PDF atau MP4 up to 50MB</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gambar Sampul (Opsional)</label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${selectedImage ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400'}`}>
                  <div className="space-y-1 text-center">
                    <svg className={`mx-auto h-12 w-12 ${selectedImage ? 'text-blue-500' : 'text-slate-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>{selectedImage ? 'Ganti gambar' : (editingModule?.image_url ? 'Ganti gambar (Opsional)' : 'Upload a image')}</span>
                        <input name="image" type="file" accept="image/*" className="sr-only" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
                      </label>
                      {!selectedImage && <p className="pl-1">or drag and drop</p>}
                    </div>
                    {selectedImage ? (
                      <p className="text-xs font-bold text-blue-600 mt-1 truncate max-w-[200px] mx-auto">
                        ✅ {selectedImage.name}
                      </p>
                    ) : editingModule?.image_url ? (
                      <p className="text-xs text-slate-400">Biarkan kosong jika tidak ingin mengubah gambar</p>
                    ) : (
                      <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
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
                {isSubmitting ? "Menyimpan..." : "Simpan Modul"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CUSTOM DELETE CONFIRMATION */}
      {deleteConfirmModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmModule(null)} />
          
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-md p-8 space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-sans">Hapus Modul?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus modul <span className="font-semibold text-slate-800">"{deleteConfirmModule.title}"</span>? Tindakan ini bersifat permanen dan akan menghapus seluruh jadwal ujian serta bank soal terkait.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModule(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW FILE (PDF/VIDEO) */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPreviewFile(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-none">{previewFile.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Preview {previewFile.type === "pdf" ? "Dokumen PDF" : "Video Materi"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 bg-slate-100 p-4 min-h-0">
              {previewFile.type === "pdf" ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-full rounded-2xl border border-slate-200/80 shadow-inner bg-white"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black rounded-2xl">
                  <video
                    src={previewFile.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-full rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
