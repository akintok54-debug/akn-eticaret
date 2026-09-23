import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { Client } from "pg";
const projectId = "prj_5JoU7Cv0X0BiwydQMn8YNjab09cq";
const linked = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
if (linked.projectId !== projectId) throw new Error("Unexpected Vercel project; stopped.");
const railwayCli = join(process.env.APPDATA, "npm/node_modules/@railway/cli/bin/railway.js");
const result = spawnSync(process.execPath, [railwayCli, "variable", "list", "--project", "c6b43b60-dfdf-405e-94bc-faf66dd03c6f", "--service", "74d63e4b-bd42-4256-8fef-d75f5155d4c5", "--environment", "production", "--json"], { encoding: "utf8", timeout: 30000 });
if (result.status !== 0) throw new Error("Railway credentials could not be read.");
const variables = JSON.parse(result.stdout);
const connectionString = variables.DATABASE_PUBLIC_URL;
if (!connectionString) throw new Error("Public database connection missing.");
const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  console.log("Railway PostgreSQL connection: OK");
  const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  console.log("Tables:", tables.rows.map(r=>r.tablename));
  if (process.argv.includes("--initialize")) {
    if (tables.rows.length !== 0) throw new Error("Initialization requires an empty database.");
    const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: connectionString }, encoding: "utf8", timeout: 120000 });
    if (migration.status !== 0) throw new Error("Migration failed; inspect migration status before retrying.");
    console.log("PostgreSQL migration: applied");
  }
  if (process.argv.includes("--connect")) {
    const cli = join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js");
    const upload = spawnSync(process.execPath, [cli, "env", "add", "DATABASE_URL", "production", "--project", projectId, "--scope", "bahadir2", "--yes", "--sensitive"], { input: connectionString, encoding: "utf8", timeout: 30000 });
    if (upload.status !== 0) throw new Error("DATABASE_URL upload failed; existing values were not overwritten.");
    console.log("Vercel production DATABASE_URL: configured");
    const contents = readFileSync(".env", "utf8");
    const line = `DATABASE_URL=${JSON.stringify(connectionString)}`;
    const updated = /^DATABASE_URL=.*$/m.test(contents) ? contents.replace(/^DATABASE_URL=.*$/m, () => line) : `${contents}\n${line}\n`;
    writeFileSync(".env", updated, { mode: 0o600 });
    console.log("Local DATABASE_URL: configured (secret omitted)");
  }
  if (tables.rows.some(r=>r.tablename==="_prisma_migrations")) {
    const migrations = await client.query('SELECT migration_name, finished_at IS NOT NULL AS completed FROM "_prisma_migrations"');
    console.log("Migrations:", migrations.rows);
  }
  if (tables.rows.some(r=>r.tablename==="Product")) {
    const counts = await client.query('SELECT COUNT(*)::int AS count FROM "Product"');
    console.log("Product count:",counts.rows[0].count);
  }
} catch(error) { console.error("Database check failed:", error.code ?? "connection error"); process.exitCode=1; }
finally { await client.end(); }
