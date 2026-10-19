const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const CLOUDFLARE_CONTEXT = `
Cloudflare Workers: globally distributed serverless compute for request handling and application logic.
Workers AI: serverless GPU inference accessed through an AI binding, without managing model servers.
AI Gateway: visibility and control for model calls, including analytics, logging, caching, rate limiting, retries, and fallback.
Cloudflare Cache: globally distributed cache. Cache only reusable, non-sensitive responses; bypass it for regulated or confidential workloads.
Durable Objects: strongly consistent coordination and state for stateful agents, sessions, WebSockets, and distributed workflows.
D1: serverless SQL for durable structured application records.
R2: object storage for documents and unstructured content without egress charges.
Vectorize: globally distributed vector database for semantic search and retrieval-augmented generation.
Cloudflare Access: identity-aware access control for internal applications and APIs.
Turnstile and WAF: bot mitigation and application-layer protection.
`;

const SCENARIOS = {
  bank: {
    name: "Regulated bank knowledge assistant",
    workload: "Internal assistant for operations teams that answers from approved runbooks. Responses need citations, access control, auditability, and protection from data leakage.",
    users: "5,000 internal users across APJC",
    region: "India and Singapore",
    sensitivity: "regulated",
    priority: "security",
  },
  commerce: {
    name: "India retail support copilot",
    workload: "Customer-support copilot for a large Indian commerce platform. Traffic is bursty during sales and the team wants fast responses close to users with predictable model costs.",
    users: "100,000 daily users",
    region: "India",
    sensitivity: "internal",
    priority: "latency",
  },
  developer: {
    name: "Developer documentation agent",
    workload: "Public developer assistant that answers product questions from documentation, keeps conversation context, and can create a sample configuration after user approval.",
    users: "20,000 developers across APJC",
    region: "APJC",
    sensitivity: "public",
    priority: "resilience",
  },
};

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="A Cloudflare-native AI architecture advisor for customer discovery and solution design.">
    <title>EdgePilot — AI Architecture Advisor</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230b1220'/%3E%3Cpath d='M13 38c0-6 5-11 11-11 2-8 9-13 18-11 6 1 11 7 11 14 5 1 8 5 8 10H13v-2z' fill='%23f6821f'/%3E%3Cpath d='M18 47h28' stroke='%236bb7ff' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E">
    <style>
      :root {
        color-scheme: dark;
        --ink: #f7f9fc;
        --muted: #9aa7b8;
        --panel: rgba(17, 28, 47, .88);
        --panel-2: #101a2d;
        --line: rgba(169, 184, 205, .17);
        --orange: #f6821f;
        --orange-2: #ffad66;
        --blue: #6bb7ff;
        --green: #6ee7b7;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        color: var(--ink);
        background: radial-gradient(circle at 82% 8%, rgba(246,130,31,.15), transparent 28rem), radial-gradient(circle at 10% 82%, rgba(107,183,255,.10), transparent 30rem), #070c15;
      }
      body::before {
        content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .23;
        background-image: linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
        background-size: 36px 36px;
      }
      button, input, textarea, select { font: inherit; }
      button { cursor: pointer; }
      .shell { width: min(1440px, 100%); margin: auto; padding: 24px; position: relative; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
      .brand { display: flex; align-items: center; gap: 13px; }
      .mark { width: 42px; height: 42px; display: grid; place-items: center; color: var(--orange); background: rgba(246,130,31,.12); border: 1px solid rgba(246,130,31,.35); border-radius: 12px; }
      .mark svg { width: 25px; }
      h1 { font-size: 1.1rem; margin: 0; letter-spacing: -.01em; }
      .brand p { margin: 2px 0 0; color: var(--muted); font-size: .82rem; }
      .status { display: flex; align-items: center; gap: 9px; color: #cad3df; font-size: .86rem; padding: 9px 12px; border: 1px solid var(--line); background: rgba(10,17,29,.75); border-radius: 999px; }
      .status i { width: 8px; height: 8px; background: var(--green); border-radius: 50%; box-shadow: 0 0 14px var(--green); }
      .layout { display: grid; grid-template-columns: minmax(0, .92fr) minmax(420px, 1.08fr); gap: 20px; }
      .panel { border: 1px solid var(--line); background: var(--panel); backdrop-filter: blur(16px); border-radius: 20px; overflow: hidden; box-shadow: 0 18px 70px rgba(0,0,0,.23); }
      .panel-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--line); }
      .eyebrow { color: var(--orange-2); font-size: .72rem; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
      .panel h2 { font-size: 1rem; margin: 4px 0 0; }
      .step { color: var(--muted); font-size: .78rem; }
      form { padding: 20px; }
      label { display: block; color: #d8e0eb; font-size: .86rem; font-weight: 650; margin-bottom: 8px; }
      textarea, input, select { width: 100%; border: 1px solid var(--line); color: var(--ink); background: #0a1322; border-radius: 11px; outline: none; padding: 12px 13px; }
      textarea:focus, input:focus, select:focus { border-color: rgba(107,183,255,.7); box-shadow: 0 0 0 3px rgba(107,183,255,.1); }
      textarea { resize: vertical; min-height: 126px; line-height: 1.5; }
      .field { margin-bottom: 16px; }
      .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .scenarios { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
      .scenario { color: #c9d3e1; background: rgba(255,255,255,.035); border: 1px solid var(--line); border-radius: 999px; padding: 8px 11px; font-size: .78rem; }
      .scenario:hover, .scenario:focus-visible { border-color: rgba(246,130,31,.6); color: #fff; }
      .submit { width: 100%; border: 0; color: #181007; background: linear-gradient(135deg, var(--orange-2), var(--orange)); border-radius: 12px; padding: 13px 16px; font-weight: 800; box-shadow: 0 8px 30px rgba(246,130,31,.22); }
      .submit:disabled { cursor: wait; opacity: .65; }
      .result { min-height: 690px; display: flex; flex-direction: column; }
      .result-body { padding: 22px; flex: 1; }
      .empty { min-height: 410px; display: grid; place-items: center; text-align: center; color: var(--muted); }
      .empty svg { width: 74px; color: rgba(107,183,255,.6); margin-bottom: 14px; }
      .empty h3 { color: #e8edf4; margin: 0 0 7px; font-size: 1rem; }
      .empty p { margin: 0; max-width: 32rem; line-height: 1.55; font-size: .9rem; }
      .answer { white-space: pre-wrap; line-height: 1.65; color: #d9e2ee; font-size: .94rem; }
      .meta { display: none; gap: 8px; flex-wrap: wrap; padding-top: 18px; margin-top: 20px; border-top: 1px solid var(--line); }
      .meta span { color: #afbed0; background: rgba(107,183,255,.07); border: 1px solid rgba(107,183,255,.16); padding: 6px 9px; border-radius: 7px; font-size: .75rem; }
      .flow { border-top: 1px solid var(--line); padding: 18px 20px 20px; }
      .flow-title { color: var(--muted); font-size: .73rem; text-transform: uppercase; letter-spacing: .11em; margin-bottom: 12px; }
      .flow-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .node { min-height: 64px; padding: 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); position: relative; }
      .node:not(:last-child)::after { content: "→"; position: absolute; right: -9px; top: 21px; color: var(--orange); z-index: 2; }
      .node b { display: block; font-size: .78rem; margin-bottom: 4px; }
      .node small { color: var(--muted); font-size: .69rem; line-height: 1.35; display: block; }
      .error { color: #fecdd3; border: 1px solid rgba(251,113,133,.3); background: rgba(251,113,133,.09); border-radius: 10px; padding: 12px; }
      footer { color: #748398; font-size: .75rem; text-align: center; padding: 20px 0 4px; }
      @media (max-width: 900px) { .shell { padding: 16px; } .layout { grid-template-columns: 1fr; } .result { min-height: 570px; } }
      @media (max-width: 560px) { header { align-items: flex-start; } .status { font-size: 0; padding: 10px; } .two, .flow-row { grid-template-columns: 1fr 1fr; } .node:nth-child(2)::after { display: none; } }
      @media (prefers-reduced-motion: no-preference) { .panel { animation: rise .45s ease-out both; } .panel:nth-child(2) { animation-delay: .08s; } @keyframes rise { from { opacity: 0; transform: translateY(10px); } } }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="brand">
          <div class="mark" aria-hidden="true"><svg viewBox="0 0 64 44" fill="none"><path d="M4 34c0-7 6-13 13-13 3-10 12-17 23-14 8 2 14 9 14 18 6 1 10 6 10 13H4v-4Z" fill="currentColor"/></svg></div>
          <div><h1>EdgePilot</h1><p>AI architecture advisor · Cloudflare Developer Platform</p></div>
        </div>
        <div class="status"><i></i><span>Running at the edge</span></div>
      </header>

      <main class="layout">
        <section class="panel" aria-labelledby="discovery-title">
          <div class="panel-head"><div><div class="eyebrow">Customer discovery</div><h2 id="discovery-title">Describe the workload</h2></div><span class="step">01 / 02</span></div>
          <form id="advisor-form">
            <div class="scenarios" aria-label="Example customer scenarios">
              <button class="scenario" type="button" data-scenario="bank">Regulated bank</button>
              <button class="scenario" type="button" data-scenario="commerce">India retail</button>
              <button class="scenario" type="button" data-scenario="developer">Developer platform</button>
            </div>
            <div class="field"><label for="workload">What is the customer building?</label><textarea id="workload" name="workload" maxlength="1400" required placeholder="Example: An internal AI assistant that answers from approved runbooks and must support users across India and Singapore..."></textarea></div>
            <div class="two">
              <div class="field"><label for="users">Expected usage</label><input id="users" name="users" maxlength="100" placeholder="5,000 internal users"></div>
              <div class="field"><label for="region">Primary region</label><input id="region" name="region" maxlength="100" value="India and APJC"></div>
            </div>
            <div class="two">
              <div class="field"><label for="sensitivity">Data sensitivity</label><select id="sensitivity" name="sensitivity"><option value="public">Public</option><option value="internal">Internal</option><option value="regulated" selected>Regulated</option></select></div>
              <div class="field"><label for="priority">Top priority</label><select id="priority" name="priority"><option value="latency">Low latency</option><option value="security" selected>Security</option><option value="resilience">Resilience</option><option value="cost">Cost control</option></select></div>
            </div>
            <button class="submit" id="submit" type="submit">Generate Cloudflare architecture</button>
          </form>
        </section>

        <section class="panel result" aria-labelledby="recommendation-title">
          <div class="panel-head"><div><div class="eyebrow">Solution design</div><h2 id="recommendation-title">Recommended architecture</h2></div><span class="step">02 / 02</span></div>
          <div class="result-body">
            <div class="empty" id="empty"><div><svg viewBox="0 0 120 90" fill="none" aria-hidden="true"><rect x="7" y="9" width="106" height="72" rx="14" stroke="currentColor" stroke-width="2"/><path d="M25 28h29M25 40h49M25 52h33" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="89" cy="47" r="13" stroke="#f6821f" stroke-width="3"/><path d="m98 57 9 9" stroke="#f6821f" stroke-width="3" stroke-linecap="round"/></svg><h3>Ready for a customer scenario</h3><p>EdgePilot turns discovery inputs into a practical Cloudflare design with request flow, controls, trade-offs, and a clear proof-of-concept plan.</p></div></div>
            <div class="answer" id="answer" hidden aria-live="polite"></div>
            <div class="meta" id="meta"><span>Cloudflare Workers</span><span>Workers AI</span><span>AI Gateway</span><span id="cache-policy">Cache policy: contextual</span></div>
          </div>
          <div class="flow">
            <div class="flow-title">Request path</div>
            <div class="flow-row">
              <div class="node"><b>Customer</b><small>Browser or application</small></div>
              <div class="node"><b>Worker</b><small>Validation and orchestration</small></div>
              <div class="node"><b>AI Gateway</b><small>Control and observability</small></div>
              <div class="node"><b>Workers AI</b><small>Serverless inference</small></div>
            </div>
          </div>
        </section>
      </main>
      <footer>Built as a customer-facing proof of concept on Cloudflare's global developer platform.</footer>
    </div>
    <script>
      const scenarios = ${JSON.stringify(SCENARIOS)};
      const form = document.querySelector('#advisor-form');
      const submit = document.querySelector('#submit');
      const empty = document.querySelector('#empty');
      const answer = document.querySelector('#answer');
      const meta = document.querySelector('#meta');
      const cachePolicy = document.querySelector('#cache-policy');
      document.querySelectorAll('[data-scenario]').forEach(function (button) {
        button.addEventListener('click', function () {
          const scenario = scenarios[button.dataset.scenario];
          document.querySelector('#workload').value = scenario.workload;
          document.querySelector('#users').value = scenario.users;
          document.querySelector('#region').value = scenario.region;
          document.querySelector('#sensitivity').value = scenario.sensitivity;
          document.querySelector('#priority').value = scenario.priority;
        });
      });
      form.addEventListener('submit', async function (event) {
        event.preventDefault(); submit.disabled = true; submit.textContent = 'Designing architecture…'; empty.hidden = true; answer.hidden = false; answer.textContent = 'Reviewing requirements and mapping Cloudflare services…'; meta.style.display = 'none';
        const body = Object.fromEntries(new FormData(form).entries());
        try {
          const response = await fetch('/api/advise', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Unable to create the architecture');
          answer.textContent = data.recommendation; cachePolicy.textContent = data.cachePolicy; meta.style.display = 'flex';
        } catch (error) {
          answer.innerHTML = ''; const box = document.createElement('div'); box.className = 'error'; box.textContent = error.message; answer.appendChild(box);
        } finally { submit.disabled = false; submit.textContent = 'Generate Cloudflare architecture'; }
      });
    </script>
  </body>
</html>`;

function securityHeaders(contentType) {
  return {
    "content-type": contentType,
    "cache-control": "no-store",
    "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: securityHeaders("application/json; charset=utf-8") });
}

function clean(value, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validateInput(input) {
  const allowedSensitivity = new Set(["public", "internal", "regulated"]);
  const allowedPriority = new Set(["latency", "security", "resilience", "cost"]);
  const workload = clean(input?.workload, 1400);
  if (workload.length < 20) return { error: "Please describe the customer workload in a little more detail." };
  return { value: { workload, users: clean(input?.users, 100) || "Not specified", region: clean(input?.region, 100) || "APJC", sensitivity: allowedSensitivity.has(input?.sensitivity) ? input.sensitivity : "internal", priority: allowedPriority.has(input?.priority) ? input.priority : "resilience" } };
}

function buildPrompt(input) {
  return `You are a senior Cloudflare Solutions Architect speaking with a technical customer in APJC.

Use only the platform facts in the supplied context. Be candid: do not claim that Cloudflare replaces a customer's system of record or that every workload should run at the edge. Do not invent compliance certifications, regional guarantees, or product capabilities.

Cloudflare platform context:
${CLOUDFLARE_CONTEXT}

Customer discovery:
- Workload: ${input.workload}
- Expected usage: ${input.users}
- Primary region: ${input.region}
- Data sensitivity: ${input.sensitivity}
- Top priority: ${input.priority}

Produce a concise recommendation using exactly these headings:
1. Recommended design
2. Request flow
3. Security and governance
4. Resilience and cost controls
5. Trade-offs and open questions
6. Two-week proof of concept

Under each heading use 2-4 short bullet points. Explicitly connect each recommended Cloudflare product to the customer requirement it addresses. For regulated data, state that caching is disabled by default and recommend validation with the customer's security, privacy, and compliance teams.`;
}

function fallbackRecommendation(input) {
  const cache = input.sensitivity === "public" ? "Use short-lived caching for repeatable, non-personal prompts." : "Disable prompt/response caching until data classification and retention are approved.";
  return `1. Recommended design
• Run the customer-facing API on Cloudflare Workers so validation and orchestration execute close to users in ${input.region}.
• Use Workers AI for serverless inference and AI Gateway as the control point for model visibility, limits, retries, and future provider fallback.
• Add Vectorize with R2 only when the proof of concept introduces approved documents and source-grounded answers.

2. Request flow
• Client → Worker for authentication context, validation, and policy checks.
• Worker → AI Gateway → Workers AI for the model response.
• Return a structured recommendation with request identifiers for operational tracing.

3. Security and governance
• Treat the workload as ${input.sensitivity}; minimize prompt data and avoid sending secrets or raw customer records.
• ${cache}
• For an internal deployment, put Cloudflare Access in front and validate identity, retention, and audit requirements.

4. Resilience and cost controls
• Apply request limits and token caps at the Worker and AI Gateway layers.
• Define retry boundaries and a model fallback only for safe, repeatable requests.
• Monitor request count, tokens, errors, and latency before setting production quotas.

5. Trade-offs and open questions
• Confirm latency SLOs, model-quality expectations, data residency, identity source, peak concurrency, and acceptable fallback behavior.
• Keep systems of record behind existing enterprise controls; use the edge layer for secure access and orchestration.

6. Two-week proof of concept
• Week 1: validate one user journey, threat model, request path, and measurable baseline.
• Week 2: add approved grounding data, failure tests, usage dashboards, and a go/no-go review.`;
}

async function advise(request, env) {
  let raw;
  try { raw = await request.json(); } catch { return json({ error: "Send a valid JSON request." }, 400); }
  const checked = validateInput(raw);
  if (checked.error) return json({ error: checked.error }, 400);
  const input = checked.value;
  const cacheSensitive = input.sensitivity !== "public";
  if (!env?.AI?.run) {
    return json({ recommendation: fallbackRecommendation(input), mode: "local-fallback", model: null, cachePolicy: cacheSensitive ? "Caching disabled · sensitive workload" : "Caching eligible · public workload" });
  }
  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: "You produce practical, technically precise cloud architecture guidance." },
        { role: "user", content: buildPrompt(input) },
      ],
      max_tokens: 900,
      temperature: 0.2,
    }, { gateway: { id: env.AI_GATEWAY_ID || "default", skipCache: cacheSensitive } });
    return json({ recommendation: result?.response || fallbackRecommendation(input), mode: "workers-ai", model: MODEL, cachePolicy: cacheSensitive ? "AI Gateway cache bypassed · sensitive workload" : "AI Gateway cache allowed · public workload" });
  } catch (error) {
    console.error("Workers AI request failed", error);
    return json({ recommendation: fallbackRecommendation(input), mode: "resilient-fallback", model: MODEL, cachePolicy: "Inference fallback used · request not cached" });
  }
}

export default {
  async fetch(request, env, ctx) {
    void ctx;
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return new Response(page, { headers: securityHeaders("text/html; charset=utf-8") });
    if (request.method === "GET" && url.pathname === "/api/health") return json({ ok: true, runtime: "Cloudflare Workers", ai: Boolean(env?.AI?.run), gateway: env?.AI_GATEWAY_ID || "default", model: MODEL });
    if (request.method === "POST" && url.pathname === "/api/advise") return advise(request, env);
    return json({ error: "Not found" }, 404);
  },
};

export { MODEL, buildPrompt, fallbackRecommendation, validateInput };
