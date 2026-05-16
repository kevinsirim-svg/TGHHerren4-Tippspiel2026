import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Diagnose-Endpoint: zeigt was die aktuell eingeloggte Session sieht.
// Aufruf einfach mit Browser auf /api/diag/me - keine Auth-Header noetig
// (Cookie wird automatisch vom Browser mitgeschickt).

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  if (!user) {
    return NextResponse.json(
      { stage: "no-user", error: userErr?.message ?? null },
      { status: 401 },
    );
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: tips, error: tipsErr } = await supabase
    .from("game_tips")
    .select("*")
    .eq("user_id", user.id);

  const { data: seriesTips, error: stErr } = await supabase
    .from("series_tips")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json({
    auth_user_id: user.id,
    auth_user_email: user.email,
    profile,
    profile_error: profileErr?.message ?? null,
    game_tips_count: tips?.length ?? 0,
    game_tips: tips,
    game_tips_error: tipsErr?.message ?? null,
    series_tips_count: seriesTips?.length ?? 0,
    series_tips: seriesTips,
    series_tips_error: stErr?.message ?? null,
  });
}
