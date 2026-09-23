import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import { Client } from "pg";
import { isValidTurkishIban } from "../src/lib/bank.ts";

const env = {};
for (const name of [".env", ".env.local", ".env.admin.local"]) {
  if (existsSync(name)) Object.assign(env, parse(readFileSync(name)));
}
Object.assign(env, process.env);
const checks = [];
console.log("Yerel yapılandırma kontrolü: Vercel'deki gizli değerler bu komutla indirilmez.");
function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "HAZIR" : "EKSİK"} — ${name}: ${detail}`);
}
let databaseUrl;
try { databaseUrl = new URL(env.DATABASE_URL); } catch { /* Report below without printing credentials. */ }
const validDatabase = databaseUrl && ["postgresql:", "postgres:"].includes(databaseUrl.protocol) && !["HOST", "host", "localhost"].includes(databaseUrl.hostname) && databaseUrl.password && !["PASSWORD", "password"].includes(databaseUrl.password);
check("Veritabanı adresi", validDatabase, validDatabase ? "PostgreSQL bağlantı biçimi uygun; erişim henüz sınanmadı." : "AKN Railway DATABASE_PUBLIC_URL değerini DATABASE_URL olarak girin.");
check("Yönetici", env.ADMIN_USER && env.ADMIN_PASSWORD?.length >= 16, "Kullanıcı adı ve güçlü parola gereklidir; değerler gizlendi.");
check("Oturum anahtarı", env.SESSION_SECRET?.length >= 32, "En az 32 karakterli SESSION_SECRET gerekir.");
check("Site adresi", env.SITE_URL === "https://www.aknmotosiklet.com", "SITE_URL=https://www.aknmotosiklet.com");
check("Banka bilgileri", env.BANK_ACCOUNT_NAME?.trim() && isValidTurkishIban(env.BANK_IBAN ?? ""), "Gerçek alıcı ünvanı ve kontrol basamakları geçerli TR IBAN gerekir.");
check("PostgreSQL geçişi", readFileSync("prisma/postgresql-migrations/migration_lock.toml", "utf8").includes('"postgresql"'), "PostgreSQL'e özel başlangıç geçişi seçili.");
console.log(`BİLGİ — Sipariş alımı: ${env.CHECKOUT_ENABLED === "true" ? "açılması istenmiş; tüm koşullar doğrulanmalı" : "kapalı"}.`);

if (process.argv.includes("--database") && validDatabase) {
  const client = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    const names = new Set(tables.rows.map(r => r.tablename));
    const required = ["Product", "Customer", "Address", "Order", "OrderItem"];
    check("Veritabanı tabloları", required.every(name => names.has(name)), "Ürün, müşteri, adres ve sipariş tabloları kontrol edildi.");
    const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='Order'");
    const columnNames = new Set(columns.rows.map(r => r.column_name));
    check("Güvenli sipariş alanları", columnNames.has("guestSessionId") && columnNames.has("checkoutKey"), "Misafir oturumu ve tekrar sipariş koruması alanları gereklidir.");
    if (names.has("_prisma_migrations")) {
      const migrations = await client.query('SELECT migration_name, finished_at IS NOT NULL AS completed FROM "_prisma_migrations" ORDER BY started_at');
      console.log("BİLGİ — Geçiş geçmişi:", JSON.stringify(migrations.rows));
    }
    await client.query("ROLLBACK");
  } catch (error) {
    check("Veritabanı erişimi", false, `Bağlantı/doğrulama başarısız (${error.code ?? "bağlantı hatası"}).`);
  } finally { await client.end(); }
}
console.log("BİLGİ — Bu kontrol hiçbir veritabanı kaydını veya ortam ayarını değiştirmez. DNS, işletme metinleri, canlı stok ve ödeme testi ayrıca doğrulanmalıdır.");
if (checks.some(item => !item.ok)) process.exitCode = 1;
