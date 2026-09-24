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
console.log("BİLGİ — Yeni misafir ve müşteri oturumları veritabanında süreli token hashleri kullanır; SESSION_SECRET yalnızca eski çerezlerin uyumluluğu içindir.");
check("Site adresi", env.SITE_URL === "https://www.aknmotosiklet.com", "SITE_URL=https://www.aknmotosiklet.com");
if (!process.argv.includes("--database")) console.log("BİLGİ — Paneldeki banka/kargo ve satış ayarları için --database kontrolünü çalıştırın.");
check("PostgreSQL geçişi", readFileSync("prisma/postgresql-migrations/migration_lock.toml", "utf8").includes('"postgresql"'), "PostgreSQL'e özel başlangıç geçişi seçili.");
console.log(`BİLGİ — Sipariş alımı: ${env.CHECKOUT_ENABLED === "true" ? "açılması istenmiş; tüm koşullar doğrulanmalı" : "kapalı"}.`);

if (process.argv.includes("--database") && validDatabase) {
  const client = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query("BEGIN READ ONLY");
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    const names = new Set(tables.rows.map(r => r.tablename));
    const required = ["Product", "Customer", "Address", "Order", "OrderItem", "CustomerAccount", "CustomerSession", "GuestSession", "StoreSettings", "Coupon", "CatalogEntry"];
    check("Veritabanı tabloları", required.every(name => names.has(name)), "Ürün, müşteri, adres ve sipariş tabloları kontrol edildi.");
    const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='Order'");
    const columnNames = new Set(columns.rows.map(r => r.column_name));
    check("Güvenli sipariş alanları", ["guestSessionId","checkoutKey","shippingCompany","trackingNumber","paymentStatus","couponCode"].every(name => columnNames.has(name)), "Misafir oturumu ve tekrar sipariş koruması alanları gereklidir.");
    if (names.has("StoreSettings")) {
      const result=await client.query('SELECT "enabled","bankName","iban","shipping","threshold" FROM "StoreSettings" WHERE id=$1',["main"]);
      const settings=result.rows[0]??{enabled:env.CHECKOUT_ENABLED==="true",bankName:env.BANK_ACCOUNT_NAME,iban:env.BANK_IBAN,shipping:Number(env.SHIPPING_PRICE??99),threshold:Number(env.FREE_SHIPPING_THRESHOLD??2000)};
      check("Havale ve kargo ayarları",settings.bankName?.trim()&&isValidTurkishIban(settings.iban??"")&&Number.isFinite(settings.shipping)&&settings.shipping>=0&&Number.isFinite(settings.threshold)&&settings.threshold>=0,"Değerler gizlendi; ayarlar panelden tamamlanabilir.");
      check("Sipariş alımı",settings.enabled,"Panelde sipariş alımı açık olmalıdır.");
    }
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
