"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabase";
import { prisma } from "./db";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password harus diisi" };
  }

  // 1. Authenticate with Supabase
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Kredensial tidak valid" };
  }

  // 2. Check if user is an admin in Prisma DB
  const userRecord = await prisma.user.findUnique({
    where: { id: data.user.id },
  });

  if (!userRecord || userRecord.role !== "ADMIN") {
    // Optionally sign out from supabase
    await supabaseAdmin.auth.signOut();
    return { error: "Akses ditolak: Anda bukan admin" };
  }

  // 3. Set a simple auth cookie
  // Note: we must await cookies() in Next.js 15+
  const cookieStore = await cookies();
  cookieStore.set("admin_session", data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/login");
}
