import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const loginEmail = process.env.LOGIN_EMAIL || "";
  const loginUsername = (process.env.LOGIN_USERNAME || "").toLowerCase();
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  if (!loginEmail || !loginUsername || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Login is not configured." },
      { status: 500 }
    );
  }

  if ((username || "").toLowerCase() !== loginUsername) {
    return NextResponse.json({ error: "Invalid username." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message || "Invalid credentials." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
}
