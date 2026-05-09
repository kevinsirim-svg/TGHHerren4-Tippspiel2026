import { requireUser } from "@/lib/supabase/auth";
import { dismissWelcome } from "./actions";

export default async function WelcomePage() {
  const { profile } = await requireUser({ skipWelcomeRedirect: true });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">Willkommen{profile ? `, ${profile.display_name}` : ""}!</h1>

      <section className="flex flex-col gap-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        <p>So funktioniert das Tippspiel:</p>

        <div>
          <h2 className="mb-1 font-semibold text-black dark:text-white">Was du tippen kannst</h2>
          <ul className="list-disc pl-5">
            <li>Den Sieger jedes einzelnen Spiels</li>
            <li>Den Sieger jeder Serie + die Anzahl der Spiele (4–7)</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-black dark:text-white">Punkte</h2>
          <ul className="list-disc pl-5">
            <li><b>1 Punkt</b> pro korrektem Spielsieger</li>
            <li><b>3 Punkte</b> für korrekten Serien-Sieger</li>
            <li><b>+2 Bonus</b>, wenn auch die Anzahl der Spiele stimmt</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-black dark:text-white">Deadlines</h2>
          <ul className="list-disc pl-5">
            <li>Spiel-Tipps: bis zum Tip-Off des jeweiligen Spiels</li>
            <li>Serien-Tipps: bis zum ersten Spiel der Serie</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 font-semibold text-black dark:text-white">Vergleich</h2>
          <p>
            Die Tipps der anderen siehst du erst, sobald du selbst getippt hast – oder
            spaetestens, wenn die Deadline abgelaufen ist.
          </p>
        </div>
      </section>

      <form action={dismissWelcome}>
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Verstanden, los geht's
        </button>
      </form>
    </main>
  );
}
