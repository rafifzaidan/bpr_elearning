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

  // 1. Direct developer/mock bypass check (instant login for offline test)
  const isDevBypass = email === "admin@bpr.com" && password === "AdminPassword123!";
  const isMockBypass = (email === "rafifsd25@gmail.com" || email === "rafifzaidan07@gmail.com") && password === "AdminPassword123!";

  if (isDevBypass || isMockBypass) {
    console.log(`Developer Session Bypass triggered for ${email}...`);
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "dev-session-token-bypass", {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
    redirect("/");
  }

  try {
    // 2. Authenticate with Supabase online
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: "Kredensial tidak valid" };
    }

    // 3. Check if user is an admin in Prisma DB
    const userRecord = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!userRecord || userRecord.role !== "ADMIN") {
      await supabaseAdmin.auth.signOut();
      return { error: "Akses ditolak: Anda bukan admin" };
    }

    // 4. Set a simple auth cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    redirect("/");
  } catch (err: any) {
    // Check if redirect error to let Next.js handle it
    if (err.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: "Koneksi ke Supabase gagal atau terjadi kesalahan server." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/login");
}
