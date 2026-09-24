import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as membership from "../src/lib/membership.ts";

// Real handlers with isolated database doubles; no secrets or live data used.
const require = createRequire(import.meta.url);
function route(name, db, denied = null) {
  const source = readFileSync(new URL("../src/app/api/" + name + "/route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const imports = { "@/lib/customer-session": { currentCustomer: async () => null, sameOrigin: () => true }, "@/lib/pricing": { unitPrice: (p) => p.retailPrice }, "@/lib/prisma": { prisma: db }, "@/lib/admin": { adminGuard: () => denied, isAdmin: () => !denied }, "@/lib/membership": membership, "@/lib/guest-session": { guestSession: async () => null } };
  new Function("require", "exports", code)(name => name in imports ? imports[name] : require(name), exports);
  return exports;
}
const tx = db => ({ ...db, $transaction: async run => run({ $queryRaw: async () => [], ...db }) });
const req = (body, method = "POST") => new Request("https://shop.test/api/test", { method, headers: { origin: "https://shop.test", "Content-Type": "application/json" }, body: JSON.stringify(body) });
const customer = { fullName: "Örnek Müşteri", phone: "+90 (555) 123-4567", type: "retail", active: true, discountRate: 5 };

test("phone normalization and discount boundaries", () => {
  assert.equal(membership.customerSchema.parse(customer).phone, "05551234567");
  for (const discountRate of [-1, 101, Infinity, NaN]) assert.equal(membership.customerSchema.safeParse({ ...customer, discountRate }).success, false);
});
test("management handlers deny access before any database call", async () => {
  const db = new Proxy({}, { get() { throw new Error("Unexpected database access"); } });
  for (const name of ["customers", "customer-groups", "dealer-applications", "support-tickets", "cart-tracking"]) {
    const h = route(name, db, Response.json({}, { status: 401 }));
    assert.equal((await h.GET(new Request("https://shop.test"))).status, 401);
    assert.equal((await h.PATCH(req({}, "PATCH"))).status, 401);
  }
});
test("customer creation stores the address and group transactionally", async () => {
  let created, address;
  const h = route("customers", tx({
    customerGroup: { findUnique: async () => ({ type: "retail", active: true }) },
    customer: { create: async ({ data }) => { created = data; return { id: "c", ...data }; } },
    address: { create: async ({ data }) => { address = data; } },
  }));
  assert.equal((await h.POST(req({ ...customer, groupId: "g", city: "İzmir", district: "Konak", address: "Örnek Sokak 12" }))).status, 201);
  assert.equal(created.groupId, "g"); assert.equal(address.customerId, "c"); assert.equal(address.city, "İzmir");
});
test("inactive and mismatched groups reject new customers", async () => {
  for (const group of [{ type: "dealer", active: true }, { type: "retail", active: false }]) {
    const h = route("customers", tx({ customerGroup: { findUnique: async () => group } }));
    assert.equal((await h.POST(req({ ...customer, groupId: "g" }))).status, 400);
  }
});
test("deactivation preserves customer relationships", async () => {
  let changed;
  const h = route("customers", tx({ customer: {
    findUniqueOrThrow: async () => ({ id: "c", type: "retail", groupId: null, addresses: [] }),
    update: async ({ data }) => { changed = data; return data; },
  } }));
  assert.equal((await h.PATCH(req({ id: "c", active: false }, "PATCH"))).status, 200);
  assert.equal(changed.active, false); assert.equal(changed.orders, undefined); assert.equal(changed.addresses, undefined);
});
test("conflicts and missing records return actionable HTTP status", () => {
  assert.equal(membership.membershipError({ code: "P2002" }).status, 409);
  assert.equal(membership.membershipError({ code: "P2025" }).status, 404);
  assert.equal(membership.membershipError(new SyntaxError()).status, 400);
});
test("group type cannot change while members exist", async () => {
  const h = route("customer-groups", tx({ customerGroup: { findUniqueOrThrow: async () => ({ type: "retail" }) }, customer: { count: async () => 2 } }));
  assert.equal((await h.PATCH(req({ id: "g", type: "dealer" }, "PATCH"))).status, 409);
});
const application = { ...customer, email: "test@example.com", companyName: "Örnek Ltd", taxOffice: "Konak", taxNumber: "1234567890", city: "İzmir", district: "Konak", address: "Örnek Sokak No 12" };
test("duplicate public application does not overwrite customer identity", async () => {
  let creates = 0;
  const h = route("dealers", tx({ customer: { findUnique: async () => ({ id: "c", dealerStatus: "pending" }) }, dealerApplication: {
    findFirst: async () => ({ id: "existing" }), create: async () => { creates++; },
  } }));
  assert.equal((await h.POST(req(application))).status, 200); assert.equal(creates, 0);
});
test("approval creates and links an unlinked dealer", async () => {
  let created, updated;
  const h = route("dealer-applications", tx({
    dealerApplication: { findUniqueOrThrow: async () => ({ id: "a", ...application, status: "pending" }), update: async ({ data }) => { updated = data; return data; } },
    customer: { findUnique: async () => null, create: async ({ data }) => { created = data; return { id: "c", ...data }; } },
  }));
  assert.equal((await h.PATCH(req({ id: "a", status: "approved" }, "PATCH"))).status, 200);
  assert.equal(created.type, "dealer"); assert.equal(created.dealerStatus, "approved"); assert.equal(updated.customerId, "c");
});
test("support reply appends history and rejects blank text", async () => {
  let changed;
  const h = route("support-tickets", { supportTicket: { update: async ({ data }) => { changed = data; return data; } } });
  assert.equal((await h.PATCH(req({ id: "t", message: "Yanıtınız hazır." }, "PATCH"))).status, 200);
  assert.equal(changed.messages.create.senderType, "admin"); assert.equal(changed.messages.deleteMany, undefined);
  assert.equal((await h.PATCH(req({ id: "t", message: " " }, "PATCH"))).status, 400);
});
const sessionId = "85f930af-dbf4-4c8a-b5d3-d013c9788f2f";
test("cart rejects cross-origin requests and forged completion", async () => {
  const h = route("cart-tracking", {});
  assert.equal((await h.POST(new Request("https://shop.test/api/cart-tracking", { method: "POST", headers: { origin: "https://evil.test" }, body: "{}" }))).status, 403);
  assert.equal((await h.POST(req({ sessionId, completed: true, orderId: "stolen" }))).status, 403);
});
test("completed cart cannot be cleared by a stale tab", async () => {
  const h = route("cart-tracking", tx({ shoppingCart: { findUnique: async () => ({ id: "c", completedAt: new Date() }) } }));
  assert.equal((await h.POST(req({ sessionId, items: [] }))).status, 200);
});
test("contact-only update preserves items and hides customer data", async () => {
  let changed;
  const h = route("cart-tracking", tx({
    shoppingCart: { findUnique: async () => ({ id: "cart", itemCount: 2, total: 100, checkoutStarted: true }), update: async ({ data }) => { changed = data; } },
    customer: { findUnique: async () => ({ id: "known-customer" }) },
  }));
  const response = await h.POST(req({ sessionId, customerName: "Örnek", customerPhone: "05551234567", customerId: "forged" }));
  assert.equal(response.status, 200); assert.equal(changed.items, undefined); assert.equal(changed.itemCount, 2);
  assert.equal(changed.customerId, "known-customer"); assert.deepEqual(await response.json(), { success: true });
});
test("cart prices come from catalog and duplicate lines merge", async () => {
  let created;
  const h = route("cart-tracking", tx({
    shoppingCart: { findUnique: async () => null, create: async ({ data }) => { created = data; } },
    product: { findMany: async () => [{ id: "p", name: "Gerçek Ürün", retailPrice: 25, image: null }] },
  }));
  const item = { id: "p", name: "Forged", price: 0.01, quantity: 1 };
  assert.equal((await h.POST(req({ sessionId, items: [item, item] }))).status, 200);
  assert.equal(created.total, 50); assert.equal(created.items.create.length, 1); assert.equal(created.itemCount, 2);
});
test("reminder history increments only on explicit sent status", async () => {
  let changed;
  const h = route("cart-tracking", { shoppingCart: { update: async ({ data }) => { changed = data; return data; } } });
  for (const status of ["pending", "sent", "failed"]) {
    assert.equal((await h.PATCH(req({ id: "c", channel: "sms", status, recipient: "05551234567", message: "Hatırlatma" }, "PATCH"))).status, 200);
    assert.equal(changed.reminders.create.status, status);
    assert.equal(changed.reminderCount?.increment, status === "sent" ? 1 : undefined);
  }
});

test("IdeaSoft routes require admin authentication before using connector tokens", async () => {
  const db = new Proxy({}, { get() { throw new Error("Unexpected database access"); } });
  for (const name of ["ideasoft/connect", "ideasoft/callback", "ideasoft/products", "ideasoft/import"]) {
    const handlers = route(name, db, Response.json({}, { status: 401 }));
    const handler = handlers.GET ?? handlers.POST;
    assert.equal((await handler(req({}))).status, 401);
  }
});
test("phone punctuation alone cannot create a customer", () => {
  assert.equal(membership.customerSchema.safeParse({ ...customer, phone: "(((((((((((" }).success, false);
});
