"use client";

import { useState, useEffect } from "react";
import { getQuestions, getModules, createQuestion, deleteQuestionSet, deleteQuestion } from "@/lib/actions";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [filterModule, setFilterModule] = useState("Semua Modul");
  const [filterSet, setFilterSet] = useState("Semua Set");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModalModule, setSelectedModalModule] = useState<string>("");
  const [isNewSet, setIsNewSet] = useState(false);
  const [selectedSet, setSelectedSet] = useState("Default");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [q, m] = await Promise.all([getQuestions(), getModules()]);
      setQuestions(q);
      setModules(m);
    } catch (error) {
      console.error("Error loading question data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = questions.filter((q) => {
    const matchModule = filterModule === "Semua Modul" || q.module.title === filterModule;
    const matchSet = filterSet === "Semua Set" || q.set_name === filterSet;
    return matchModule && matchSet;
  });

  const groupedQuestions = filtered.reduce((acc, q) => {
    const set = q.set_name;
    if (!acc[set]) acc[set] = [];
    acc[set].push(q);
    return acc;
  }, {} as Record<string, any[]>);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createQuestion(formData);
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bank Soal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola pertanyaan untuk setiap modul
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setIsNewSet(false);
            setSelectedSet("Default");
            if (modules.length > 0) setSelectedModalModule(modules[0].id.toString());
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Soal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={filterModule}
          onChange={(e) => {
            setFilterModule(e.target.value);
            setFilterSet("Semua Set");
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
        >
          <option>Semua Modul</option>
          {modules.map((m) => (
            <option key={m.id}>{m.title}</option>
          ))}
        </select>

        {filterModule !== "Semua Modul" && (
          <select
            value={filterSet}
            onChange={(e) => setFilterSet(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option>Semua Set</option>
            {Array.from(
              new Set(
                questions
                  .filter((q) => q.module.title === filterModule)
                  .map((q) => q.set_name)
              )
            ).map((set) => (
              <option key={set as string}>{set as string}</option>
            ))}
          </select>
        )}
      </div>

      {/* Question List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Memuat soal...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
          Belum ada soal untuk modul ini.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedQuestions).map(([setName, qs]) => (
            <div key={setName} className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Set Soal: {setName}</h2>
                  <p className="text-sm text-slate-500">{qs.length} Pertanyaan</p>
                </div>
                <button 
                  onClick={async () => {
                    if (window.confirm(`Apakah Anda yakin ingin menghapus SEMUA soal dalam set "${setName}"? Tindakan ini tidak dapat dibatalkan.`)) {
                      const moduleId = qs[0].module_id;
                      await deleteQuestionSet(moduleId, setName);
                      loadData();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Hapus Set
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {qs.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight bg-blue-50 px-2 py-0.5 rounded">
                            {q.module.title}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (window.confirm("Apakah Anda yakin ingin menghapus pertanyaan ini?")) {
                            await deleteQuestion(q.id);
                            loadData();
                          }
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="text-slate-900 font-medium">{q.text}</h3>
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
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Tambah Pertanyaan</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Modul</label>
                  <select 
                    required 
                    name="moduleId" 
                    value={selectedModalModule}
                    onChange={(e) => setSelectedModalModule(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Judul Soal (Set)</label>
                  {!isNewSet ? (
                    <select 
                      name="setName"
                      value={selectedSet}
                      onChange={(e) => {
                        if (e.target.value === "___CREATE_NEW___") {
                          setIsNewSet(true);
                          setSelectedSet("");
                        } else {
                          setSelectedSet(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none"
                    >
                      {Array.from(
                        new Set([
                          "Default",
                          ...questions
                            .filter((q) => q.module_id === parseInt(selectedModalModule))
                            .map((q) => q.set_name)
                        ])
                      ).map((set) => (
                        <option key={set as string} value={set as string}>{set as string}</option>
                      ))}
                      <option value="___CREATE_NEW___" className="text-blue-600 font-medium">+ Buat Judul Baru...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        required 
                        name="setName" 
                        type="text" 
                        value={selectedSet}
                        onChange={(e) => setSelectedSet(e.target.value)}
                        placeholder="Ketik judul baru..." 
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" 
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setIsNewSet(false);
                          setSelectedSet("Default");
                        }}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pertanyaan</label>
                <textarea required name="text" rows={2} placeholder="Tulis soal di sini..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none" />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Pilihan Jawaban</label>
                {["A", "B", "C", "D"].map((opt) => (
                  <div key={opt} className="flex gap-3 items-center">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{opt}</span>
                    <input required name={`option${opt}`} type="text" placeholder={`Isi pilihan ${opt}...`} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" />
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
              <button disabled={isSubmitting} type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">
                Batal
              </button>
              <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-lg cursor-pointer transition-all">
                {isSubmitting ? "Menyimpan..." : "Simpan Soal"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
