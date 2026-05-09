"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthFormState } from "./actions";

const initialState: AuthFormState = { error: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">NBA Tippspiel</h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "signin" ? "Mit deinem Account einloggen." : "Account erstellen, um mitzutippen."}
      </p>

      {mode === "signin" ? <SignInForm /> : <SignUpForm />}

      <button
        type="button"
        className="mt-6 text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin"
          ? "Noch keinen Account? Jetzt registrieren."
          : "Schon registriert? Hier einloggen."}
      </button>
    </main>
  );
}

function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="E-Mail" name="email" type="email" autoComplete="email" required />
      <Field label="Passwort" name="password" type="password" autoComplete="current-password" required />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>Einloggen</SubmitButton>
    </form>
  );
}

function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Anzeigename" name="displayName" type="text" autoComplete="nickname" required />
      <Field label="E-Mail" name="email" type="email" autoComplete="email" required />
      <Field label="Passwort (min. 6 Zeichen)" name="password" type="password" autoComplete="new-password" required minLength={6} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pending={pending}>Account erstellen</SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-300"
      />
    </label>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Bitte warten..." : children}
    </button>
  );
}
