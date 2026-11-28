"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Field } from "@/components/ui";
import { signIn, signUp } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const next = params.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/spaces";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setPending(true);
    setError(null);

    const result =
      mode === "sign-in"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: String(fd.get("name") ?? "").trim() || email.split("@")[0] });

    if (result.error) {
      setPending(false);
      setError(messageFor(result.error, mode));
      return;
    }
    router.replace(destination);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-title font-extrabold">{mode === "sign-in" ? "Sign in" : "Create your account"}</h1>
        <p className="mt-1 text-ink-2">
          {mode === "sign-in" ? "Welcome back. Your spaces are where you left them." : "This is a personal app. The first account becomes the owner."}
        </p>
      </div>

      {mode === "sign-up" && (
        <Field label="Your name" htmlFor="name">
          <input id="name" name="name" autoComplete="name" className="field" />
        </Field>
      )}
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" required className="field" inputMode="email" />
      </Field>
      <Field label="Password" htmlFor="password" hint={mode === "sign-up" ? "At least 8 characters." : undefined}>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          className="field"
        />
      </Field>

      {error && (
        <p role="alert" className="border border-danger/40 bg-danger-tint px-3 py-2.5 text-[0.875rem] font-medium text-danger">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        pending={pending}
        pendingLabel={mode === "sign-in" ? "Signing in…" : "Creating account…"}
        className="w-full"
      >
        {mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>

      <p className="text-[0.875rem] text-ink-2">
        {mode === "sign-in" ? (
          <>
            First time here?{" "}
            <Link href="/sign-up" className="font-semibold text-ink underline">
              Create your account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-ink underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function messageFor(error: { status?: number; message?: string; code?: string }, mode: "sign-in" | "sign-up") {
  if (error.message === "Sign-up is closed.") return "Sign-up is closed. This Spend Sense already has an owner. Sign in instead.";
  if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
    return "An account with this email already exists. Sign in instead.";
  if (error.code === "PASSWORD_TOO_SHORT") return "Use a password of at least 8 characters.";
  if (error.code === "INVALID_EMAIL") return "That email address doesn't look right.";
  if (mode === "sign-in" && (error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD"))
    return "That email and password don't match. Check them and try again.";
  return error.message || "Something went wrong. Try again.";
}
