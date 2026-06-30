// supabase/functions/generate-api-key/index.ts
//
// Dipanggil dari Admin Dashboard untuk generate API key baru.
// Key asli HANYA ditampilkan sekali saat generate — setelah itu hanya hash yang disimpan.
//
// POST https://<project-ref>.supabase.co/functions/v1/generate-api-key
// Headers:
//   Authorization: Bearer <user_access_token>   (harus login sebagai admin)
// Body:
// { "name": "museumsiroh-production" }
//
// Response:
// { "api_key": "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "key_prefix": "sk_live_" }

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

function generateRawKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sk_live_${random}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Client dengan token user, untuk verifikasi siapa yang memanggil
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRow } = await adminClient
      .from("admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name } = await req.json();
    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawKey = generateRawKey();
    const keyHash = await sha256Hex(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const { error: insertError } = await adminClient.from("api_keys").insert({
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      created_by: userData.user.id,
    });

    if (insertError) {
      console.error(insertError);
      return new Response(JSON.stringify({ error: "Failed to create API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // rawKey HANYA dikembalikan di response ini, tidak pernah disimpan di DB
    return new Response(JSON.stringify({ api_key: rawKey, key_prefix: keyPrefix }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
