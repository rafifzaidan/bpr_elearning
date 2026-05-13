"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { supabaseAdmin } from "./supabase";

/* ── 👥 USER ACTIONS ── */

export async function getUsers() {
  // Menggunakan raw query untuk bypass cache Prisma Client di Next.js (agar tidak perlu restart)
  const data = await prisma.$queryRawUnsafe<any[]>(`
    SELECT u.*, json_build_object('name', d.name) as division
    FROM users u
    LEFT JOIN divisions d ON u.division_id = d.id
    ORDER BY u.created_at DESC
  `);
  return data;
}

export async function getDivisions() {
  return await prisma.division.findMany();
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

  // 1. Create Auth User in Supabase (Service Role)
  // Email is now strictly required from frontend
  const email = emailInput.trim();

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
}

export async function updateUser(id: string, formData: FormData) {
  const email = formData.get("email") as string;
  const fullName = formData.get("fullName") as string;
  const divisionId = parseInt(formData.get("divisionId") as string);
  const role = formData.get("role") as string;
  const mfaEnabled = formData.get("mfaEnabled") === "on";

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

  revalidatePath("/users");
  return { success: true };
}

/* ── 📚 MODULE ACTIONS ── */

export async function getModules() {
  return await prisma.module.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { created_at: "desc" },
  });
}

export async function createModule(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const divisionIdsStr = formData.get("divisionIds") as string;
  const divisionIds = divisionIdsStr ? JSON.parse(divisionIdsStr).map((id: any) => parseInt(id)) : [];
  const fileType = formData.get("fileType") as string;
  const file = formData.get("file") as File;

  let fileUrl = null;

  // 1. Upload file to Supabase Storage if present
  if (file && file.size > 0) {
    const fileName = `${Date.now()}_${file.name.replaceAll(" ", "_")}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("modules")
      .upload(fileName, file);

    if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);
    fileUrl = uploadData.path;
  }

  // 2. Clear out mock data and save to DB
  await prisma.module.create({
    data: {
      title,
      description,
      division_ids: divisionIds,
      file_type: fileType,
      file_url: fileUrl,
    },
  });

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

  const updateData: any = {
    title,
    description,
    division_ids: divisionIds,
    file_type: fileType,
  };

  if (file && file.size > 0) {
    const fileName = `${Date.now()}_${file.name.replaceAll(" ", "_")}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("modules")
      .upload(fileName, file);

    if (uploadError) throw new Error(`Gagal upload file: ${uploadError.message}`);
    updateData.file_url = uploadData.path;
  }

  await prisma.module.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/modules");
  return { success: true };
}

/* ── 📝 QUESTION ACTIONS ── */

export async function getQuestions(moduleId?: number) {
  return await prisma.question.findMany({
    where: moduleId ? { module_id: moduleId } : undefined,
    include: { module: true },
    orderBy: { id: "asc" },
  });
}

export async function getQuestionSetsByModule(moduleId: number) {
  const sets = await prisma.question.findMany({
    where: { module_id: moduleId },
    select: { set_name: true },
    distinct: ['set_name'],
  });
  return sets.map(s => s.set_name);
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

  revalidatePath("/questions");
  return { success: true };
}

export async function deleteQuestionSet(moduleId: number, setName: string) {
  await prisma.question.deleteMany({
    where: {
      module_id: moduleId,
      set_name: setName,
    },
  });
  revalidatePath("/questions");
  return { success: true };
}

export async function deleteQuestion(id: number) {
  await prisma.question.delete({
    where: { id },
  });
  revalidatePath("/questions");
  return { success: true };
}

/* ── 📝 EXAM ACTIONS ── */

export async function getExams() {
  return await prisma.exam.findMany({
    include: { module: { select: { title: true } } },
    orderBy: { start_date: "desc" },
  });
}

export async function createExam(formData: FormData) {
  const title = formData.get("title") as string;
  const moduleId = parseInt(formData.get("moduleId") as string);
  const questionSetName = (formData.get("questionSetName") as string) || "Default";
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);

  await prisma.exam.create({
    data: {
      title,
      module_id: moduleId,
      question_set_name: questionSetName,
      start_date: startDate,
      end_date: endDate,
    },
  });

  revalidatePath("/exams");
  return { success: true };
}

export async function updateExam(id: number, formData: FormData) {
  const title = formData.get("title") as string;
  const moduleId = parseInt(formData.get("moduleId") as string);
  const questionSetName = (formData.get("questionSetName") as string) || "Default";
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);

  await prisma.exam.update({
    where: { id },
    data: {
      title,
      module_id: moduleId,
      question_set_name: questionSetName,
      start_date: startDate,
      end_date: endDate,
    },
  });

  revalidatePath("/exams");
  return { success: true };
}

/* ── 📊 RESULT ACTIONS ── */

export async function getResults() {
  return await prisma.result.findMany({
    include: {
      user: true,
      exam: { include: { module: { select: { title: true } } } },
    },
    orderBy: { finished_at: "desc" },
  });
}

export async function getDashboardStats() {
  const totalUsers = await prisma.user.count();
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

  // Ambil distribusi user per divisi
  const divisions = await prisma.division.findMany({
    select: {
      name: true,
      _count: {
        select: { users: true }
      }
    }
  });

  const divisionDistribution = divisions.map(d => ({
    name: d.name,
    value: d._count.users
  }));

  return {
    totalUsers,
    totalModules,
    activeExams,
    avgScore: avgScore._avg.score?.toFixed(1) || "0.0",
    divisionDistribution,
  };
}
