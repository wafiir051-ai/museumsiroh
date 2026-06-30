// supabase/functions/report-conversion/index.ts
//
// Endpoint yang dipanggil museumsiroh.online setiap kali ada order tiket
// yang berasal dari link referral affiliate (?ref=KODEUNIK).
//
// Cara pakai (dari sisi museumsiroh.online):
//
// POST https://<project-ref>.supabase.co/functions/v1/report-conversion
// Headers:
//   Content-Type: application/json
//   x-api-key: sk_live_xxxxxxxxxxxxxxxx
// Body:
// {
//   "ref_code": "AB12CD",
//   "order_id": "ORDER-2026-00123",
//   "ticket_amount": 150000
// }
//
// Response sukses:
// { "success": true, "commission_amount": 19500, "commission_rate": 13 }

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // 1. Validasi API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyHash = await sha256Hex(apiKey);
    const { data: keyRow, error: keyError } = await supabase
      .from("api_keys")
      .select("id, is_active")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (keyError || !keyRow || !keyRow.is_active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last_used_at (fire and forget)
    supabase.from("api_keys").update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id).then(() => {});

    // 2. Parse & validasi body
    const body = await req.json();
    const { ref_code, order_id, ticket_amount } = body;

    if (!ref_code || !order_id || ticket_amount === undefined) {
      return new Response(
        JSON.stringify({ error: "Required fields: ref_code, order_id, ticket_amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof ticket_amount !== "number" || ticket_amount <= 0) {
      return new Response(
        JSON.stringify({ error: "ticket_amount must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Cari affiliate berdasarkan ref_code
    const { data: affiliate, error: affError } = await supabase
      .from("affiliates")
      .select("id, status, tier_id, tiers(commission_rate)")
      .eq("ref_code", ref_code)
      .maybeSingle();

    if (affError || !affiliate) {
      return new Response(JSON.stringify({ error: "ref_code not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (affiliate.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Affiliate is not approved, conversion not recorded" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Cek duplikat order_id (idempotency)
    const { data: existing } = await supabase
      .from("conversions")
      .select("id")
      .eq("order_id", order_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "order_id already recorded", duplicate: true }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Hitung komisi & insert
    // @ts-ignore - tiers relation
    const commissionRate = affiliate.tiers.commission_rate;
    const commissionAmount = Math.round((ticket_amount * commissionRate) / 100);

    const { error: insertError } = await supabase.from("conversions").insert({
      affiliate_id: affiliate.id,
      order_id,
      ticket_amount,
      commission_amount: commissionAmount,
      commission_rate: commissionRate,
      status: "confirmed", // langsung confirmed; ubah ke 'pending' jika perlu review manual
      confirmed_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to record conversion" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
