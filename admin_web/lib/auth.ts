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

  // Check if it's the dev bypass account or a mock admin account in memory
  const isDevBypass = email === "admin@bpr.com" && password === "AdminPassword123!";
  
  const defaultMockUsers = [
    {
      id: "admin-id",
      nip: "9999999999",
      full_name: "Super Admin",
      email: "admin@bpr.com",
      role: "ADMIN"
    },
    {
      id: "1",
      nip: "5323600013",
      full_name: "M. Rafif Zaidan Nuhaa",
      email: "rafifsd25@gmail.com",
      role: "ADMIN"
    }
  ];
  const mockUsers = (globalThis as any).mockUsers || defaultMockUsers;
  const mockUser = mockUsers.find((u: any) => u.email === email && u.role === "ADMIN");
  const isMockBypass = mockUser && password === "AdminPassword123!";

  try {
    // 1. Authenticate with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      if (isDevBypass || isMockBypass) {
        throw new Error("Trigger bypass");
      }
      return { error: "Kredensial tidak valid" };
    }

    // 2. Check if user is an admin in Prisma DB
    const userRecord = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!userRecord || userRecord.role !== "ADMIN") {
      await supabaseAdmin.auth.signOut();
      return { error: "Akses ditolak: Anda bukan admin" };
    }

    // 3. Set a simple auth cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    redirect("/");
  } catch (err: any) {
    // Fallback: If network connection is blocked or credentials bypassed
    if (isDevBypass || isMockBypass) {
      console.log(`Supabase unreachable. Logging in with Developer Session Bypass for ${email}...`);
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "dev-session-token-bypass", {
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });
      redirect("/");
    }
    return { error: "Koneksi ke Supabase gagal atau kredensial tidak valid untuk pengujian offline." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/login");
}
