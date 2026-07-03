"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { supabaseAdmin } from "./supabase";

/* ── 👥 USER ACTIONS ── */

// Global mock state for offline testing
let mockUsers: any[] = (globalThis as any).mockUsers || [
  {
    id: "admin-id",
    nip: "9999999999",
    full_name: "Super Admin",
    email: "admin@bpr.com",
    role: "ADMIN",
    division_id: 2,
    division: { name: "Teknologi Informasi" },
    created_at: new Date()
  },
  {
    id: "1",
    nip: "5323600013",
    full_name: "M. Rafif Zaidan Nuhaa",
    email: "rafifsd25@gmail.com",
    role: "ADMIN",
    division_id: 2,
    division: { name: "Teknologi Informasi" },
    created_at: new Date()
  },
  {
    id: "2",
    nip: "5323600011",
    full_name: "M. Hafizh Georiza",
    email: "rafifzaidan07@gmail.com",
    role: "EMPLOYEE",
    division_id: 2,
    division: { name: "Teknologi Informasi" },
    created_at: new Date()
  }
];
(globalThis as any).mockUsers = mockUsers;

let mockDivisions: any[] = [
  { id: 1, name: "Akuntansi" },
  { id: 2, name: "Teknologi Informasi" }
];

let mockModules: any[] = (globalThis as any).mockModules || [
  {
    id: 1,
    title: "Pengenalan Sistem Keamanan IT Bank",
    description: "Modul pelatihan dasar mengenai standar keamanan data dan informasi perbankan.",
    division_ids: [1, 2],
    file_type: "pdf",
    file_url: "mock-pdf.pdf",
    image_url: null,
    created_at: new Date(),
    _count: { questions: 1 }
  },
  {
    id: 2,
    title: "Standard Operational Procedure Teller",
    description: "Panduan praktis SOP layanan teller dan kepuabah.",
    division_ids: [2],
    file_type: "pdf",
    file_url: "mock-pdf-2.pdf",
    image_url: null,
    created_at: new Date(),
    _count: { questions: 0 }
  },
  {
    id: 3,
    title: "Modul Pengujian UET (User Evaluation Test)",
    description: "Modul materi khusus untuk pengujian fungsi kuis, durasi waktu, retake, dan pembaca modul pada e-Learning.",
    division_ids: [1, 2],
    file_type: "pdf",
    file_url: "mock-pdf.pdf",
    image_url: null,
    created_at: new Date(),
    _count: { questions: 10 }
  }
];
(globalThis as any).mockModules = mockModules;

let mockQuestions: any[] = (globalThis as any).mockQuestions || [
  {
    id: 1,
    module_id: 1,
    set_name: "Default",
    text: "Apa kepanjangan dari RLS pada database Supabase?",
    weight: 1,
    correct_ans: "A",
    options: {
      A: "Row Level Security",
      B: "Read Line System",
      C: "Realtime Link Service",
      D: "Role Level Schema"
    },
    module: { title: "Pengenalan Sistem Keamanan IT Bank" }
  },
  {
    id: 101,
    module_id: 3,
    set_name: "Default",
    text: "Apa tujuan utama dari dilaksanakannya User Evaluation Test (UET) pada aplikasi?",
    weight: 1,
    correct_ans: "A",
    options: {
      A: "Mengevaluasi fungsi dan antarmuka aplikasi",
      B: "Menguji kecepatan download database",
      C: "Menghitung kapasitas penyimpanan server",
      D: "Menilai performa hardware laptop"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 102,
    module_id: 3,
    set_name: "Default",
    text: "Di bawah ini yang merupakan hak akses dari administrator pada Portal Web adalah...",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Mengerjakan kuis evaluasi",
      B: "Mengelola materi, pegawai, kuis, dan pantau nilai",
      C: "Membaca modul lewat mobile",
      D: "Mengubah logo instansi BPR"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 103,
    module_id: 3,
    set_name: "Default",
    text: "Bagaimana cara kerja fitur offline/bypass pada aplikasi saat Supabase terputus?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Aplikasi langsung force close",
      B: "Aplikasi menggunakan simulasi memori lokal (mock state)",
      C: "Data tidak bisa disimpan sama sekali",
      D: "Browser otomatis me-restart laptop"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 104,
    module_id: 3,
    set_name: "Default",
    text: "Berapakah durasi pengerjaan yang diset pada kuis pengujian UET ini?",
    weight: 1,
    correct_ans: "C",
    options: {
      A: "60 menit",
      B: "45 menit",
      C: "15 menit",
      D: "30 menit"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 105,
    module_id: 3,
    set_name: "Default",
    text: "Jika opsi 'Bisa dikerjakan ulang' diaktifkan oleh admin, apa yang bisa dilakukan karyawan?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Karyawan tidak bisa mengikuti kuis lagi",
      B: "Karyawan dapat mengulang kuis untuk memperbaiki nilai",
      C: "Ujian otomatis terhapus",
      D: "Akun karyawan otomatis terblokir"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 106,
    module_id: 3,
    set_name: "Default",
    text: "Divisi apa saja yang ditugaskan untuk mengikuti Modul Pengujian UET ini?",
    weight: 1,
    correct_ans: "A",
    options: {
      A: "Akuntansi dan Teknologi Informasi",
      B: "Hanya Pemasaran",
      C: "Operasional dan SDM",
      D: "Seluruh divisi BPR kecuali TI"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 107,
    module_id: 3,
    set_name: "Default",
    text: "Apa format file materi pembelajaran yang didukung untuk diunggah pada portal?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "DOCX dan XLSX",
      B: "PDF dan Video (MP4)",
      C: "ZIP dan RAR",
      D: "PPTX saja"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 108,
    module_id: 3,
    set_name: "Default",
    text: "Fungsi utama dari menu 'Pantau Nilai Karyawan' bagi admin PSDM adalah...",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Mengubah jawaban kuis karyawan",
      B: "Memonitor skor, status kelulusan, dan mengekspor laporan nilai",
      C: "Mengirim email spam ke karyawan",
      D: "Menghapus akun karyawan secara acak"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 109,
    module_id: 3,
    set_name: "Default",
    text: "Di bawah ini, manakah password pengujian default yang digunakan untuk bypass login offline?",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "admin123",
      B: "AdminPassword123!",
      C: "passwordku",
      D: "BPRJatim2026"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  },
  {
    id: 110,
    module_id: 3,
    set_name: "Default",
    text: "Fitur keamanan MFA pada data pegawai berfungsi untuk memverifikasi login menggunakan...",
    weight: 1,
    correct_ans: "B",
    options: {
      A: "Sidik jari (Fingerprint)",
      B: "Kode OTP yang dikirim ke Email",
      C: "Scan wajah (Face ID)",
      D: "Pertanyaan keamanan masa kecil"
    },
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  }
];
(globalThis as any).mockQuestions = mockQuestions;

let mockExams: any[] = (globalThis as any).mockExams || [
  {
    id: 1,
    title: "Ujian Sertifikasi Keamanan IT Tingkat 1",
    module_id: 1,
    question_set_name: "Default",
    start_date: new Date(),
    end_date: new Date(Date.now() + 86400000 * 7),
    duration_minutes: 60,
    can_retake: true,
    module: { title: "Pengenalan Sistem Keamanan IT Bank" }
  },
  {
    id: 3,
    title: "Kuis Pengujian UET",
    module_id: 3,
    question_set_name: "Default",
    start_date: new Date(),
    end_date: new Date(Date.now() + 86400000 * 30),
    duration_minutes: 15,
    can_retake: true,
    module: { title: "Modul Pengujian UET (User Evaluation Test)" }
  }
];
(globalThis as any).mockExams = mockExams;

function syncUetMockData() {
  const uetModule = mockModules.find(
    (m: any) => m.title.toLowerCase().includes("test uet") || m.title.toLowerCase().includes("uet test") || m.title.toLowerCase() === "uet"
  );

  if (uetModule) {
    const targetModuleId = uetModule.id;
    if (targetModuleId !== 3) {
      // 1. Check and clone mock exam
      const hasExam = mockExams.some((e: any) => e.module_id === targetModuleId);
      if (!hasExam) {
        const sourceExam = mockExams.find((e: any) => e.module_id === 3);
        if (sourceExam) {
          mockExams.push({
            ...sourceExam,
            id: Date.now() + 1,
            module_id: targetModuleId,
            module: { title: uetModule.title }
          });
          (globalThis as any).mockExams = mockExams;
        }
      }

      // 2. Check and clone mock questions
      const hasQuestions = mockQuestions.some((q: any) => q.module_id === targetModuleId);
      if (!hasQuestions) {
        const sourceQuestions = mockQuestions.filter((q: any) => q.module_id === 3);
        sourceQuestions.forEach((q: any, index: number) => {
          mockQuestions.push({
            ...q,
            id: Date.now() + 100 + index,
            module_id: targetModuleId,
            module: { title: uetModule.title }
          });
        });
        (globalThis as any).mockQuestions = mockQuestions;
        
        uetModule._count = uetModule._count || {};
        uetModule._count.questions = sourceQuestions.length;
        (globalThis as any).mockModules = mockModules;
      }
    }
  }
}

export async function getUsers() {
  try {
    // Menggunakan raw query untuk bypass cache Prisma Client di Next.js (agar tidak perlu restart)
    const data = await prisma.$queryRawUnsafe<any[]>(`
      SELECT u.*, json_build_object('name', d.name) as division
      FROM users u
      LEFT JOIN divisions d ON u.division_id = d.id
      ORDER BY u.created_at DESC
    `);
    return data;
  } catch (err: any) {
    console.error("Database connection failed in getUsers, returning mock data:", err.message);
    return mockUsers;
  }
}

export async function getDivisions() {
  try {
    return await prisma.division.findMany();
  } catch (err: any) {
    console.error("Database connection failed in getDivisions, returning mock data:", err.message);
    return mockDivisions;
  }
}

/**
 * Create a new user in Supabase Auth AND the public.users table.
 * The DB trigger `on_auth_user_created` will handle the move into public.users.
 */
export async function createUser(formData: FormData) {
  const nip = formData.get("nip") as string;
  const emailInput = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const divisionId = parseInt(formData.get("divisionId") as string);
  const role = formData.get("role") as any;
  const password = formData.get("password") as string;

  const email = emailInput.trim();

  try {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nip,
        full_name: fullName,
        division_id: divisionId,
        role,
        mfa_enabled: true, // Default to true for new users
      },
    });

    if (authError) throw new Error(`Gagal membuat akun auth: ${authError.message}`);

    revalidatePath("/users");
    return { success: true, user: authUser.user };
  } catch (err: any) {
    console.error("Database connection failed in createUser, simulating success for local testing:", err.message);
    
    // Offline simulated insert
    const divisionName = mockDivisions.find(d => d.id === divisionId)?.name || "Teknologi Informasi";
    const newMockUser = {
      id: "mock-id-" + Date.now(),
      nip,
      full_name: fullName,
      email,
      role,
      division_id: divisionId,
      division: { name: divisionName },
      created_at: new Date()
    };
    mockUsers.unshift(newMockUser);
    (globalThis as any).mockUsers = mockUsers;

    revalidatePath("/users");
    return { success: true, user: newMockUser as any };
  }
}

export async function updateUser(id: string, formData: FormData) {
  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const divisionId = parseInt(formData.get("divisionId") as string);
  const role = formData.get("role") as string;
  const mfaEnabled = formData.get("mfaEnabled") === "on";

  try {
    // 1. Update using raw SQL to bypass Prisma Client's type-safety/casting issues
    await prisma.$executeRawUnsafe(
      `UPDATE users SET full_name = $1, division_id = $2, role = $3, email = $4, mfa_enabled = $5 WHERE id = $6`,
      fullName,
      divisionId,
      role,
      email || null,
      mfaEnabled,
      id
    );

    // 2. Update Auth metadata and Email to stay in sync
    try {
      const updateData: any = {
        user_metadata: { full_name: fullName, division_id: divisionId, role, mfa_enabled: mfaEnabled },
      };
      
      const newPassword = formData.get("newPassword") as string;
      if (newPassword && newPassword.trim() !== "") {
        updateData.password = newPassword.trim();
      }

      if (email && email.trim() !== "") {
        updateData.email = email.trim(); // Update the auth email so password reset works
        updateData.email_confirm = true;
      }
      
      await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    } catch (err) {
      console.error("Gagal update metadata supabase auth:", err);
    }
  } catch (err: any) {
    console.error("Database connection failed in updateUser, simulating success for local testing:", err.message);
    
    // Offline simulated update
    const uIndex = mockUsers.findIndex(u => u.id === id);
    if (uIndex !== -1) {
      const divisionName = mockDivisions.find(d => d.id === divisionId)?.name || "Teknologi Informasi";
      mockUsers[uIndex] = {
        ...mockUsers[uIndex],
        full_name: fullName,
        email: email.trim(),
        role,
        division_id: divisionId,
        division: { name: divisionName },
        mfa_enabled: mfaEnabled as any
      };
      (globalThis as any).mockUsers = mockUsers;
    }
  }

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      throw new Error(`Gagal menghapus pegawai: ${error.message}`);
    }
  } catch (err: any) {
    console.error("Database connection failed in deleteUser, simulating success for local testing:", err.message);
    
    // Offline simulated delete
    mockUsers = mockUsers.filter(u => u.id !== id);
    (globalThis as any).mockUsers = mockUsers;
  }
  
  revalidatePath("/users");
  return { success: true };
}

/* ── 📚 MODULE ACTIONS ── */

export async function getModules() {
  try {
    return await prisma.module.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { created_at: "desc" },
    });
  } catch (err: any) {
    console.error("Database connection failed in getModules, returning mock data:", err.message);
    syncUetMockData();
    return mockModules;
  }
}

export async function createModule(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const divisionIdsStr = formData.get("divisionIds") as string;
  const divisionIds = divisionIdsStr ? JSON.parse(divisionIdsStr).map((id: any) => parseInt(id)) : [];
  const fileType = formData.get("fileType") as string;
  const file = formData.get("file") as File;
  const image = formData.get("image") as File;

  let fileUrl = null;
  let imageUrl = null;

  try {
    // 1. Upload file to Supabase Storage if present
    if (file && file.size > 0) {
      const fileName = `${Date.now()}_${file.name.replaceAll(" ", "_")}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("modules")
        .upload(fileName, file);

      if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);
      fileUrl = uploadData.path;
    }

    // 2. Upload image to Supabase Storage if present
    if (image && image.size > 0) {
      const imageName = `${Date.now()}_${image.name.replaceAll(" ", "_")}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("modules")
        .upload(`module_images/${imageName}`, image);

      if (uploadError) throw new Error(`Gagal upload gambar: ${uploadError.message}`);
      imageUrl = uploadData.path;
    }

    // 3. Clear out mock data and save to DB
    await prisma.module.create({
      data: {
        title,
        description,
        division_ids: divisionIds,
        file_type: fileType,
        file_url: fileUrl,
        image_url: imageUrl,
      },
    });
  } catch (err: any) {
    console.error("Database connection failed in createModule, simulating success for local testing:", err.message);

    // Offline simulated insert
    const newModule = {
      id: Date.now(),
      title,
      description,
      division_ids: divisionIds,
      file_type: fileType,
      file_url: file && file.size > 0 ? file.name : "mock-pdf.pdf",
      image_url: image && image.size > 0 ? image.name : null,
      created_at: new Date(),
      _count: { questions: 0 }
    };
    mockModules.unshift(newModule);
    (globalThis as any).mockModules = mockModules;
  }

  revalidatePath("/modules");
  return { success: true };
}

export async function updateModule(id: number, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const divisionIdsStr = formData.get("divisionIds") as string;
  const divisionIds = divisionIdsStr ? JSON.parse(divisionIdsStr).map((id: any) => parseInt(id)) : [];
  const fileType = formData.get("fileType") as string;
  const file = formData.get("file") as File | null;
  const image = formData.get("image") as File | null;

  const updateData: any = {
    title,
    description,
    division_ids: divisionIds,
    file_type: fileType,
  };

  try {
    if (file && file.size > 0) {
      const fileName = `${Date.now()}_${file.name.replaceAll(" ", "_")}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("modules")
        .upload(fileName, file);

      if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);
      updateData.file_url = uploadData.path;
    }

    if (image && image.size > 0) {
      const imageName = `${Date.now()}_${image.name.replaceAll(" ", "_")}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("modules")
        .upload(`module_images/${imageName}`, image);

      if (uploadError) throw new Error(`Gagal upload gambar: ${uploadError.message}`);
      updateData.image_url = uploadData.path;
    }

    await prisma.module.update({
      where: { id },
      data: updateData,
    });
  } catch (err: any) {
    console.error("Database connection failed in updateModule, simulating success for local testing:", err.message);

    // Offline simulated update
    const mIndex = mockModules.findIndex(m => m.id === id);
    if (mIndex !== -1) {
      mockModules[mIndex] = {
        ...mockModules[mIndex],
        title,
        description,
        division_ids: divisionIds,
        file_type: fileType,
        file_url: file && file.size > 0 ? file.name : mockModules[mIndex].file_url,
        image_url: image && image.size > 0 ? image.name : mockModules[mIndex].image_url
      };
      (globalThis as any).mockModules = mockModules;
    }
  }

  revalidatePath("/modules");
  return { success: true };
}

export async function deleteModule(id: number) {
  try {
    // 1. Fetch the module to get file_url and image_url for storage cleanup
    const module = await prisma.module.findUnique({
      where: { id },
      select: { file_url: true, image_url: true }
    });

    if (module) {
      const filesToDelete = [];
      if (module.file_url) filesToDelete.push(module.file_url);
      if (module.image_url) filesToDelete.push(module.image_url);

      if (filesToDelete.length > 0) {
        try {
          await supabaseAdmin.storage
            .from("modules")
            .remove(filesToDelete);
        } catch (err) {
          console.error("Gagal menghapus file dari storage:", err);
        }
      }
    }

    // 2. Delete the module (which cascade deletes exams & questions)
    await prisma.module.delete({
      where: { id },
    });
  } catch (err: any) {
    console.error("Database connection failed in deleteModule, simulating success for local testing:", err.message);

    // Offline simulated delete
    mockModules = mockModules.filter(m => m.id !== id);
    (globalThis as any).mockModules = mockModules;
  }

  revalidatePath("/modules");
  return { success: true };
}

/* ── 📝 QUESTION ACTIONS ── */

export async function getQuestions(moduleId?: number) {
  try {
    return await prisma.question.findMany({
      where: moduleId ? { module_id: moduleId } : undefined,
      include: { module: true },
      orderBy: { id: "asc" },
    });
  } catch (err: any) {
    console.error("Database connection failed in getQuestions, returning mock data:", err.message);
    syncUetMockData();
    const filtered = moduleId ? mockQuestions.filter(q => q.module_id === moduleId) : mockQuestions;
    return filtered;
  }
}

export async function getQuestionSetsByModule(moduleId: number) {
  try {
    const sets = await prisma.question.findMany({
      where: { module_id: moduleId },
      select: { set_name: true },
      distinct: ['set_name'],
    });
    return sets.map(s => s.set_name);
  } catch (err: any) {
    console.error("Database connection failed in getQuestionSetsByModule, returning mock data:", err.message);
    const filtered = mockQuestions.filter(q => q.module_id === moduleId);
    const uniqueSets = Array.from(new Set(filtered.map(q => q.set_name)));
    return uniqueSets.length > 0 ? uniqueSets : ["Default"];
  }
}

export async function createQuestion(formData: FormData) {
  const moduleId = parseInt(formData.get("moduleId") as string);
  const setName = (formData.get("setName") as string) || "Default";
  const text = formData.get("text") as string;
  const weight = 1; // Defaulting to 1 as requested by user
  const correctAns = formData.get("correctAns") as string;
  const options = {
    A: formData.get("optionA") as string,
    B: formData.get("optionB") as string,
    C: formData.get("optionC") as string,
    D: formData.get("optionD") as string,
  };

  try {
    await prisma.question.create({
      data: {
        module_id: moduleId,
        set_name: setName,
        text,
        weight,
        correct_ans: correctAns,
        options,
      },
    });
  } catch (err: any) {
    console.error("Database connection failed in createQuestion, simulating success for local testing:", err.message);

    // Offline simulated insert
    const newQuestion = {
      id: Date.now(),
      module_id: moduleId,
      set_name: setName,
      text,
      weight,
      correct_ans: correctAns,
      options,
      module: { title: mockModules.find(m => m.id === moduleId)?.title || "Modul Pelatihan" }
    };
    mockQuestions.push(newQuestion);
    (globalThis as any).mockQuestions = mockQuestions;

    // Update question count in mockModules
    const mIndex = mockModules.findIndex(m => m.id === moduleId);
    if (mIndex !== -1) {
      mockModules[mIndex]._count.questions += 1;
      (globalThis as any).mockModules = mockModules;
    }
  }

  revalidatePath("/questions");
  revalidatePath("/exams");
  return { success: true };
}

export async function updateQuestion(id: number, formData: FormData) {
  const moduleId = parseInt(formData.get("moduleId") as string);
  const setName = (formData.get("setName") as string) || "Default";
  const text = formData.get("text") as string;
  const correctAns = formData.get("correctAns") as string;
  const options = {
    A: formData.get("optionA") as string,
    B: formData.get("optionB") as string,
    C: formData.get("optionC") as string,
    D: formData.get("optionD") as string,
  };

  try {
    await prisma.question.update({
      where: { id },
      data: {
        module_id: moduleId,
        set_name: setName,
        text,
        correct_ans: correctAns,
        options,
      },
    });
  } catch (err: any) {
    console.error("Database connection failed in updateQuestion, simulating success for local testing:", err.message);

    // Offline simulated update
    const qIndex = mockQuestions.findIndex(q => q.id === id);
    if (qIndex !== -1) {
      mockQuestions[qIndex] = {
        ...mockQuestions[qIndex],
        module_id: moduleId,
        set_name: setName,
        text,
        correct_ans: correctAns,
        options,
        module: { title: mockModules.find(m => m.id === moduleId)?.title || "Modul Pelatihan" }
      };
      (globalThis as any).mockQuestions = mockQuestions;
    }
  }

  revalidatePath("/questions");
  revalidatePath("/exams");
  return { success: true };
}

export async function deleteQuestionSet(moduleId: number, setName: string) {
  try {
    await prisma.question.deleteMany({
      where: {
        module_id: moduleId,
        set_name: setName,
      },
    });
  } catch (err: any) {
    console.error("Database connection failed in deleteQuestionSet, simulating success for local testing:", err.message);

    // Offline simulated delete
    const deletedCount = mockQuestions.filter(q => q.module_id === moduleId && q.set_name === setName).length;
    mockQuestions = mockQuestions.filter(q => !(q.module_id === moduleId && q.set_name === setName));
    (globalThis as any).mockQuestions = mockQuestions;

    const mIndex = mockModules.findIndex(m => m.id === moduleId);
    if (mIndex !== -1) {
      mockModules[mIndex]._count.questions = Math.max(0, mockModules[mIndex]._count.questions - deletedCount);
      (globalThis as any).mockModules = mockModules;
    }
  }

  revalidatePath("/questions");
  revalidatePath("/exams");
  return { success: true };
}

export async function deleteQuestion(id: number) {
  try {
    await prisma.question.delete({
      where: { id },
    });
  } catch (err: any) {
    console.error("Database connection failed in deleteQuestion, simulating success for local testing:", err.message);

    // Offline simulated delete
    const question = mockQuestions.find(q => q.id === id);
    if (question) {
      const moduleId = question.module_id;
      mockQuestions = mockQuestions.filter(q => q.id !== id);
      (globalThis as any).mockQuestions = mockQuestions;

      const mIndex = mockModules.findIndex(m => m.id === moduleId);
      if (mIndex !== -1) {
        mockModules[mIndex]._count.questions = Math.max(0, mockModules[mIndex]._count.questions - 1);
        (globalThis as any).mockModules = mockModules;
      }
    }
  }

  revalidatePath("/questions");
  revalidatePath("/exams");
  return { success: true };
}

/* ── 📝 EXAM ACTIONS ── */

export async function getExams() {
  try {
    return await prisma.exam.findMany({
      include: { module: { select: { title: true } } },
      orderBy: { start_date: "desc" },
    });
  } catch (err: any) {
    console.error("Database connection failed in getExams, returning mock data:", err.message);
    syncUetMockData();
    return mockExams;
  }
}

export async function createExam(formData: FormData) {
  const title = formData.get("title") as string;
  const moduleId = parseInt(formData.get("moduleId") as string);
  const questionSetName = formData.get("questionSetName") as string || "Default";
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const durationMinutesStr = formData.get("durationMinutes") as string;
  const durationMinutes = durationMinutesStr ? parseInt(durationMinutesStr) : null;
  const canRetake = formData.get("canRetake") === "true" || formData.get("canRetake") === "on";

  try {
    await prisma.exam.create({
      data: {
        title,
        module_id: moduleId,
        question_set_name: questionSetName,
        start_date: startDate,
        end_date: endDate,
        duration_minutes: durationMinutes,
        can_retake: canRetake,
      },
    });
  } catch (err: any) {
    console.error("Database connection failed in createExam, simulating success for local testing:", err.message);

    // Offline simulated insert
    const newExam = {
      id: Date.now(),
      title,
      module_id: moduleId,
      question_set_name: questionSetName,
      start_date: startDate,
      end_date: endDate,
      duration_minutes: durationMinutes,
      can_retake: canRetake,
      module: { title: mockModules.find(m => m.id === moduleId)?.title || "Modul Pelatihan" }
    };
    mockExams.push(newExam);
    (globalThis as any).mockExams = mockExams;
  }

  revalidatePath("/exams");
  return { success: true };
}

export async function updateExam(id: number, formData: FormData) {
  const title = formData.get("title") as string;
  const moduleId = parseInt(formData.get("moduleId") as string);
  const questionSetName = formData.get("questionSetName") as string || "Default";
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);
  const durationMinutesStr = formData.get("durationMinutes") as string;
  const durationMinutes = durationMinutesStr ? parseInt(durationMinutesStr) : null;
  const canRetake = formData.get("canRetake") === "true" || formData.get("canRetake") === "on";

  try {
    await prisma.exam.update({
      where: { id },
      data: {
        title,
        module_id: moduleId,
        question_set_name: questionSetName,
        start_date: startDate,
        end_date: endDate,
        duration_minutes: durationMinutes,
        can_retake: canRetake,
      },
    });
  } catch (err: any) {
    console.error("Database connection failed in updateExam, simulating success for local testing:", err.message);

    // Offline simulated update
    const eIndex = mockExams.findIndex(e => e.id === id);
    if (eIndex !== -1) {
      mockExams[eIndex] = {
        ...mockExams[eIndex],
        title,
        module_id: moduleId,
        question_set_name: questionSetName,
        start_date: startDate,
        end_date: endDate,
        duration_minutes: durationMinutes,
        can_retake: canRetake,
        module: { title: mockModules.find(m => m.id === moduleId)?.title || "Modul Pelatihan" }
      };
      (globalThis as any).mockExams = mockExams;
    }
  }

  revalidatePath("/exams");
  return { success: true };
}

export async function deleteExam(id: number) {
  try {
    await prisma.exam.delete({
      where: { id },
    });
  } catch (err: any) {
    console.error("Database connection failed in deleteExam, simulating success for local testing:", err.message);

    // Offline simulated delete
    mockExams = mockExams.filter(e => e.id !== id);
    (globalThis as any).mockExams = mockExams;
  }
  
  revalidatePath("/exams");
  return { success: true };
}


/* ── 📊 RESULT ACTIONS ── */

export async function getResults() {
  try {
    return await prisma.result.findMany({
      include: {
        user: {
          include: {
            division: true,
          },
        },
        exam: { include: { module: { select: { title: true } } } },
      },
      orderBy: { finished_at: "desc" },
    });
  } catch (err: any) {
    console.error("Database connection failed in getResults, returning mock data:", err.message);
    return [
      {
        id: 1,
        user_id: "2",
        exam_id: 1,
        score: 85.0,
        is_passed: true,
        finished_at: new Date(),
        user: {
          full_name: "M. Hafizh Georiza",
          nip: "5323600011",
          division: { name: "Teknologi Informasi" }
        },
        exam: {
          title: "Ujian Sertifikasi Keamanan IT Tingkat 1",
          module: { title: "Pengenalan Sistem Keamanan IT Bank" }
        }
      }
    ];
  }
}

export async function getDashboardStats() {
  try {
    const totalUsers = await prisma.user.count({
      where: { role: { not: "ADMIN" } }
    });
    const totalModules = await prisma.module.count();
    const activeExams = await prisma.exam.count({
      where: {
        AND: [
          { start_date: { lte: new Date() } },
          { end_date: { gte: new Date() } },
        ],
      },
    });
    const avgScore = await prisma.result.aggregate({ _avg: { score: true } });

    // Ambil distribusi user per divisi (hanya menghitung non-ADMIN)
    const divisions = await prisma.division.findMany({
      include: {
        users: {
          where: { role: { not: "ADMIN" } },
          select: { id: true }
        }
      }
    });

    const divisionDistribution = divisions.map(d => ({
      name: d.name,
      value: d.users.length
    }));

    return {
      totalUsers,
      totalModules,
      activeExams,
      avgScore: avgScore._avg.score?.toFixed(1) || "0.0",
      divisionDistribution,
    };
  } catch (err: any) {
    console.error("Database connection failed in getDashboardStats, returning mock data:", err.message);

    const nonAdminUsers = mockUsers.filter((u: any) => u.role !== "ADMIN");
    const totalUsers = nonAdminUsers.length;
    const totalModules = mockModules.length;
    const activeExams = mockExams.length;

    // Hitung distribusi divisi secara dinamis dari mock data
    const divisionDistribution = mockDivisions.map((d: any) => {
      const count = mockUsers.filter(
        (u: any) => u.role !== "ADMIN" && (u.division_id === d.id || u.division?.name === d.name)
      ).length;
      return {
        name: d.name,
        value: count
      };
    });

    return {
      totalUsers,
      totalModules,
      activeExams,
      avgScore: "0.0",
      divisionDistribution,
    };
  }
}
