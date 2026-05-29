"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Server actions pour l'authentification Supabase.
 * Toutes les actions retournent une string d'erreur ou redirect en cas de succès.
 */

export type AuthState = {
  error?: string;
  success?: string;
};

// ─────────────────────────────────────────────────────────────────
//  Sign in (email + password)
// ─────────────────────────────────────────────────────────────────
export async function signInAction(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "/app/dashboard";

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : `Erreur de connexion : ${error.message}`,
    };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

// ─────────────────────────────────────────────────────────────────
//  Sign up (email + password)
// ─────────────────────────────────────────────────────────────────
export async function signUpAction(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const displayName = (formData.get("display_name") as string)?.trim();

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "https://maxlinestudio.fr";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: { name: displayName || email.split("@")[0] },
    },
  });

  if (error) {
    return { error: `Inscription échouée : ${error.message}` };
  }

  return {
    success:
      "Inscription effectuée. Vérifiez votre boîte mail pour confirmer votre adresse.",
  };
}

// ─────────────────────────────────────────────────────────────────
//  Sign out
// ─────────────────────────────────────────────────────────────────
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ─────────────────────────────────────────────────────────────────
//  Demande réinitialisation mot de passe (envoi email)
// ─────────────────────────────────────────────────────────────────
export async function requestPasswordResetAction(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email requis." };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "https://maxlinestudio.fr";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?type=recovery`,
  });

  if (error) {
    return { error: `Erreur : ${error.message}` };
  }

  return {
    success:
      "Si cette adresse existe dans nos systèmes, un email de réinitialisation a été envoyé.",
  };
}

// ─────────────────────────────────────────────────────────────────
//  OAuth Google
// ─────────────────────────────────────────────────────────────────
export async function signInWithGoogleAction(formData: FormData) {
  const redirectTo = (formData.get("redirect") as string) || "/app/dashboard";

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "https://maxlinestudio.fr";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Google OAuth indisponible : " + error.message)}`,
    );
  }

  if (data?.url) {
    redirect(data.url);
  }
}
