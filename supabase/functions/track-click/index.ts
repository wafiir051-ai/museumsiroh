// supabase/functions/track-click/index.ts
//
// Dipanggil oleh redirect page (museumsiroh.online atau halaman perantara kita)
// setiap kali ada orang yang klik link referral: ?ref=KODEUNIK
//
// POST https://<project-ref>.supabase.co/functions/v1/track-click
// Body:
// {
//   "ref_code": "AB12CD",
//   "source": "whatsapp"   // optional: whatsapp, instagram, offline-qr, dll
// }

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + "siroh-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { ref_code, source } = await req.json();

    if (!ref_code) {
      return new Response(JSON.stringify({ error: "ref_code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("ref_code", ref_code)
      .eq("status", "approved")
      .maybeSingle();

    if (!affiliate) {
      // Tetap return 200 supaya tidak mengganggu UX redirect ke museumsiroh.online,
      // tapi tidak mencatat klik apa pun.
      return new Response(JSON.stringify({ success: false, reason: "ref_code not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const forwarded = req.headers.get("x-forwarded-for") || "unknown";
    const ipHash = await hashIp(forwarded);
    const userAgent = req.headers.get("user-agent") || "unknown";

    await supabase.from("clicks").insert({
      affiliate_id: affiliate.id,
      ip_hash: ipHash,
      user_agent: userAgent,
      source: source || "direct",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
