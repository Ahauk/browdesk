import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

export type AuthResult =
  | { ok: true; session: Session | null; user: User | null }
  | { ok: false; error: string };

/** Map Supabase auth errors to Spanish, user-facing messages. */
function humanizeError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Ya existe una cuenta con ese correo.";
  if (m.includes("email not confirmed"))
    return "Confirma tu correo antes de iniciar sesión.";
  if (m.includes("password") && m.includes("at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("network") || m.includes("fetch"))
    return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  return message;
}

function notConfigured(): AuthResult {
  return {
    ok: false,
    error: "La nube no está configurada. Contacta al soporte.",
  };
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { ok: false, error: humanizeError(error.message) };
  return { ok: true, session: data.session, user: data.user };
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { ok: false, error: humanizeError(error.message) };
  return { ok: true, session: data.session, user: data.user };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase()
  );
  if (error) return { ok: false, error: humanizeError(error.message) };
  return { ok: true, session: null, user: null };
}

/**
 * Subscribe to cloud auth changes. Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (session: Session | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}
