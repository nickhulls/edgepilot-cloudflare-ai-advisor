import test from "node:test";
import assert from "node:assert/strict";
import worker, { MODEL, validateInput } from "../worker/index.js";

test("serves the working architecture advisor", async () => {
  const response = await worker.fetch(new Request("https://example.com/"), {}, {});
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /EdgePilot/);
  assert.match(html, /Generate Cloudflare architecture/);
});

test("rejects an underspecified workload", () => {
  assert.equal(validateInput({ workload: "too short" }).error.length > 0, true);
});

test("calls Workers AI through the configured gateway", async () => {
  let call;
  const env = { AI_GATEWAY_ID: "default", AI: { async run(model, input, options) { call = { model, input, options }; return { response: "1. Recommended design\n• Use Cloudflare Workers." }; } } };
  const request = new Request("https://example.com/api/advise", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ workload: "A regulated internal assistant for operational runbooks across APJC.", users: "5,000", region: "India and Singapore", sensitivity: "regulated", priority: "security" }),
  });
  const response = await worker.fetch(request, env, {});
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.mode, "workers-ai");
  assert.equal(call.model, MODEL);
  assert.equal(call.options.gateway.id, "default");
  assert.equal(call.options.gateway.skipCache, true);
});

test("allows gateway caching only for public scenarios", async () => {
  let skipCache;
  const env = { AI: { async run(_model, _input, options) { skipCache = options.gateway.skipCache; return { response: "Public recommendation" }; } } };
  const response = await worker.fetch(new Request("https://example.com/api/advise", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ workload: "A public documentation assistant for developers using a product API.", sensitivity: "public", priority: "latency" }),
  }), env, {});
  assert.equal(response.status, 200);
  assert.equal(skipCache, false);
});
