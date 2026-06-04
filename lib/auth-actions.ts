"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  REF_COOKIE,
  REF_COOKIE_MAX_AGE,
  sanitizeReferralCode,
} from "@/lib/referral";

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
  const ref = sanitizeReferralCode((formData.get("ref") as string) || "");
  // Intention de paiement (depuis la landing) : on la garde dans le lien de
  // confirmation pour reprendre le paiement après confirmation de l'email.
  const checkout = ((formData.get("checkout") as string) || "")
    .replace(/[^a-z-]/gi, "")
    .slice(0, 24);

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }
  // Exigences mot de passe — alignées sur la config Supabase Auth (min 8 +
  // au moins une lettre et un chiffre). On valide aussi ici pour un message
  // clair en français plutôt que l'erreur brute du serveur d'auth.
  if (password.length < 8) {
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      error: "Le mot de passe doit contenir au moins une lettre et un chiffre.",
    };
  }

  // Mémorise le code de parrainage pour le réclamer après confirmation email.
  if (ref) {
    const cookieStore = await cookies();
    cookieStore.set(REF_COOKIE, ref, {
      maxAge: REF_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "https://maxlinestudio.fr";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: checkout
        ? `${origin}/auth/confirm?checkout=${encodeURIComponent(checkout)}`
        : `${origin}/auth/confirm`,
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

  // Mémorise un éventuel parrainage avant la redirection OAuth.
  const ref = sanitizeReferralCode((formData.get("ref") as string) || "");
  if (ref) {
    const cookieStore = await cookies();
    cookieStore.set(REF_COOKIE, ref, {
      maxAge: REF_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

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
