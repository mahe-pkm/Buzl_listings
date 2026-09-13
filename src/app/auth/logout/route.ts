import { createClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/staging";
import { NextResponse } from "next/server";

function loginRedirect() {
  return new URL("/login", getAppBaseUrl());
}

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(loginRedirect(), {
    status: 303,
  });
}

export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(loginRedirect(), {
    status: 303,
  });
}
