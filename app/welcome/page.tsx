import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { dismissWelcome } from "./actions";

export const dynamic = "force-dynamic";

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const params = await searchParams;
  const { profile } = await requireUser({ skipWelcomeRedirect: true });
  // Wenn die Seite per "Regeln"-Link aufgerufen wird, kein Onboarding-Button anzeigen.
  const isReadOnly = params.from === "rules";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-6 py-10">
      {isReadOnly && (
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-orange-400"
        >
          ← Zurueck
        </Link>
      )}

      <header className="border-b border-zinc-800 pb-3">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          {isReadOnly ? (
            <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Spielregeln</span>
          ) : (
            <>
              <span className="text-white">Willkommen</span>
              {profile ? <span className="text-zinc-300">, {profile.display_name}</span> : null}
            </>
          )}
        </h1>
        {!isReadOnly && (
          <p className="text-xs uppercase tracking-widest text-zinc-500">So funktioniert das Tippspiel</p>
        )}
      </header>

      <section className="flex flex-col gap-5 text-sm leading-6 text-zinc-300">
        <div>
          <h2 className="nba-section-title mb-2">Was du tippen kannst</h2>
          <ul className="list-disc pl-5">
            <li>Den Sieger jedes einzelnen Spiels</li>
            <li>Den Sieger jeder Serie + die Anzahl der Spiele (4–7)</li>
            <li>Den NBA Champion (ab Conference Finals, einmalig)</li>
          </ul>
        </div>

        <div>
          <h2 className="nba-section-title mb-2">Punkte</h2>
          <ul className="list-disc pl-5">
            <li><b className="text-white">1 Punkt</b> pro korrektem Spielsieger</li>
            <li><b className="text-white">3 Punkte</b> fuer korrekten Serien-Sieger</li>
            <li><b className="text-white">+2 Bonus</b>, wenn auch die Anzahl der Spiele stimmt</li>
            <li><b className="text-orange-400">10 Punkte</b> fuer den richtigen NBA Champion</li>
          </ul>
        </div>

        <div>
          <h2 className="nba-section-title mb-2">Deadlines</h2>
          <ul className="list-disc pl-5">
            <li>Spiel-Tipps: bis zum Tip-Off des jeweiligen Spiels</li>
            <li>Serien-Tipps: bis zum ersten Spiel der Serie</li>
            <li>Champion-Tipp: bis zum Tip-Off des ersten Conf-Finals-Spiels</li>
          </ul>
          <p className="mt-2 text-xs text-zinc-500">
            Tipps sind nach Abgabe <b>final</b> und koennen nicht mehr geaendert werden.
          </p>
        </div>

        <div>
          <h2 className="nba-section-title mb-2">Vergleich</h2>
          <p>
            Die Tipps der anderen siehst du erst, sobald du selbst getippt hast – oder
            spaetestens wenn die Deadline abgelaufen ist.
          </p>
        </div>
      </section>

      {!isReadOnly ? (
        <form action={dismissWelcome}>
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-rose-400"
          >
            Verstanden, los geht&apos;s
          </button>
        </form>
      ) : (
        <Link
          href="/"
          className="rounded-md border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider text-zinc-200 hover:border-orange-500/60 hover:bg-zinc-800"
        >
          Zurueck zur Uebersicht
        </Link>
      )}
    </main>
  );
}
