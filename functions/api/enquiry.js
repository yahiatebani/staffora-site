// Cloudflare Pages Function: POST /api/enquiry
// Stores the enquiry in Supabase and emails an alert through Resend, using whichever is configured.
// Settings (Cloudflare Pages > Settings > Variables and secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_KEY   store each enquiry in the "enquiries" table
//   RESEND_API_KEY, ENQUIRY_TO           email each enquiry to ENQUIRY_TO
//   ENQUIRY_FROM (optional)              sender, default "Beyondesk <enquiries@beyondesk.co.uk>" (domain must be verified in Resend)
// With neither configured it answers 503, and the page offers the visitor a ready written email instead.

const FIELDS = ["trade", "role", "start", "systems", "notes", "name", "company", "email", "phone", "page"];
const LIMITS = { notes: 2000, systems: 300, page: 200 };

function clean(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max || 200);
}
function reply(body, status, isForm) {
  if (isForm) {
    const ok = body.ok;
    const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ok ? "Enquiry received" : "Please email us"} | Beyondesk</title>
<body style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:80px auto;padding:0 20px;color:#0F2A44">
<h1 style="font-size:28px">${ok ? "Thanks. Your enquiry is in." : "We could not send that automatically."}</h1>
<p style="color:#55657A;font-size:17px;line-height:1.6">${ok ? "We will come back to you with a written cost for the role." : "Please email hello@beyondesk.co.uk and we will reply with a written cost for the role."}</p>
<p><a href="/" style="color:#0066D6">Back to Beyondesk</a></p></body>`;
    return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  const type = request.headers.get("content-type") || "";
  const isForm = !type.includes("application/json");
  let raw = {};
  try {
    if (isForm) { const f = await request.formData(); f.forEach((v, k) => { raw[k] = v; }); }
    else raw = await request.json();
  } catch (e) { return reply({ ok: false, reason: "bad_request" }, 400, isForm); }

  if (raw.website) return reply({ ok: true }, 200, isForm); // honeypot: pretend success

  const d = {};
  for (const k of FIELDS) d[k] = clean(raw[k], LIMITS[k]);
  if (!d.name || !d.company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !d.trade || !d.role) {
    return reply({ ok: false, reason: "missing_fields" }, 400, isForm);
  }

  let stored = false, emailed = false;
  const row = { ...d, created_at: new Date().toISOString(), user_agent: clean(request.headers.get("user-agent"), 300), country: clean(request.headers.get("cf-ipcountry"), 4) };

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    try {
      const r = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/enquiries`, {
        method: "POST",
        headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(row),
      });
      stored = r.ok;
    } catch (e) { stored = false; }
  }

  if (env.RESEND_API_KEY && env.ENQUIRY_TO) {
    const text = [
      `New Beyondesk enquiry from ${d.name}, ${d.company}`, "",
      `Trade: ${d.trade}`, `Role: ${d.role}`, `Start: ${d.start || "not given"}`, `Systems: ${d.systems || "not given"}`,
      `What to take off their plate: ${d.notes || "not given"}`, "",
      `Email: ${d.email}`, `Phone: ${d.phone || "not given"}`, `Page: ${d.page}`, `Received: ${row.created_at}`,
      stored ? "Saved to the enquiries table." : "Not saved to a database. This email is the only copy.",
    ].join("\n");
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.ENQUIRY_FROM || "Beyondesk <enquiries@beyondesk.co.uk>",
          to: env.ENQUIRY_TO.split(",").map(s => s.trim()),
          reply_to: d.email,
          subject: `Enquiry: ${d.company} (${d.trade}, ${d.role})`,
          text,
        }),
      });
      emailed = r.ok;
    } catch (e) { emailed = false; }
  }

  if (!stored && !emailed) return reply({ ok: false, reason: "not_configured" }, 503, isForm);
  return reply({ ok: true, stored, emailed }, 200, isForm);
}
