# EdgePilot: step-by-step build and interview story

## 1. Start with customer discovery

**What we built:** A structured intake for workload, usage, geography, data sensitivity, and the customer's top priority.

**Why:** A Solutions Architect should not begin with a product list. These answers determine latency, security, state, model, and caching choices.

**Cloudflare use:** None yet by design. This is the customer-conversation layer that determines which Cloudflare capabilities are justified.

**Say to James:** “I made discovery part of the product. The recommendation changes based on sensitivity and priority rather than forcing the same reference architecture on every customer.”

## 2. Put the application on Cloudflare Workers

**What we built:** One Worker serves the UI and the `/api/advise` and `/api/health` APIs.

**Why:** The same deployable unit handles the customer experience and server-side orchestration, with no application server to provision.

**Cloudflare use:** Workers is the globally distributed serverless runtime. It validates input, limits field sizes, selects policy, calls the model, handles errors, and returns the response.

**Say to James:** “Workers is the policy and orchestration boundary. I keep the model call server-side and avoid exposing credentials or provider details to the browser.”

## 3. Use Workers AI for inference

**What we built:** The Worker calls `@cf/meta/llama-3.3-70b-instruct-fp8-fast` through the native `AI` binding.

**Why:** This demonstrates serverless inference without managing GPU hosts, autoscaling, or a separate model-serving stack.

**Cloudflare use:** Workers AI runs the model on Cloudflare-managed GPU infrastructure. The application accesses it as `env.AI`, not through a client-side key.

**Say to James:** “The AI binding makes inference a platform primitive. The customer can validate the use case before committing to dedicated model infrastructure.”

## 4. Put AI Gateway in the inference path

**What we built:** Each model call uses AI Gateway ID `default`.

**Why:** Model calls need operational and financial controls, not only a successful response.

**Cloudflare use:** AI Gateway provides analytics and logging and can add caching, rate limits, retries, and provider fallback. EdgePilot explicitly bypasses gateway caching for internal and regulated workloads.

**Say to James:** “The important design choice is not that caching exists; it is when not to cache. I tied the cache decision to data classification.”

## 5. Make failure visible and recoverable

**What we built:** Input errors return clear 4xx responses. If inference fails, the Worker returns a deterministic architecture baseline and marks the response as a fallback mode.

**Why:** A customer demo and a production service both need defined degraded behavior.

**Cloudflare use:** Workers owns the failure boundary. AI Gateway can later apply bounded retries and model fallback, while Workers Observability captures runtime signals.

**Say to James:** “I separated application fallback from model retry. That prevents retry storms and lets the product degrade predictably.”

## 6. Apply basic security controls

**What we built:** Strict input limits, same-origin API calls, no browser credentials, no-store responses, a content security policy, clickjacking protection, and restricted browser permissions.

**Why:** Even a PoC should show a credible security posture, particularly for enterprise and financial-services conversations.

**Cloudflare use:** The Worker applies security policy at the application edge. A customer deployment can add Access for identity-aware access and Turnstile/WAF for abuse protection.

**Say to James:** “I kept identity and bot controls as explicit next steps because the correct configuration depends on whether the workload is internal or public.”

## 7. Validate and deploy globally

**What we built:** Automated tests confirm routing, input validation, Workers AI invocation, AI Gateway configuration, and the cache rule for sensitive data.

**Why:** The demo should be repeatable and defensible, not a one-time screen recording.

**Cloudflare use:** Wrangler deploys the Worker to a `workers.dev` URL on Cloudflare's network. `/api/health` confirms that the AI binding and gateway configuration are active.

**Say to James:** “The deliverable is a live URL, source code, tests, and an architecture story. I can use the same assets in a customer workshop.”

## What to build next and why it is not in v1

1. **R2 + Vectorize:** Store approved source documents and retrieve relevant passages so recommendations are cited and updateable. Add only after the source corpus and access rules are clear.
2. **Cloudflare Access:** Protect internal scenarios using the customer's identity provider. Add after the identity and authorization model are agreed.
3. **Durable Objects:** Add stateful sessions or real-time coordination only if the user journey needs durable conversational state.
4. **D1:** Store assessments and feedback if the customer needs history, filtering, or reporting.
5. **Turnstile/WAF:** Protect a public endpoint once the exposure and abuse model are known.

This restraint is part of the architecture: every product must solve a stated customer requirement.

## Questions James may ask

**Why Workers instead of a regional VM or container?**  
For a lightweight globally accessed API, Workers removes server management and puts request handling close to users. A container may still be appropriate for long-running, unsupported-runtime, or specialized compute workloads.

**Why Workers AI instead of Bedrock or another provider?**  
Workers AI makes this PoC fast and operationally simple. AI Gateway preserves a path to multiple providers; production model choice should be based on quality, latency, policy, and cost tests.

**Why disable caching for regulated prompts?**  
Because performance is secondary to approved data handling. Enable caching only after classification, key design, retention, and isolation are agreed.

**Where is the RAG?**  
Version one grounds the model with a small curated context to keep the PoC focused. Version two would store approved documents in R2, embed them with Workers AI, retrieve passages from Vectorize, and include citations.

**What would you measure?**  
End-to-end latency, model latency, error rate, input/output tokens, cost per successful task, cache hit rate for eligible prompts, answer quality, and fallback frequency.

**What is the production risk?**  
Unvalidated data residency and retention, prompt injection through future documents, model-quality drift, unbounded usage, and an unclear fallback policy. Each requires an explicit control and owner.
