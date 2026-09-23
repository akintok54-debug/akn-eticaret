import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { parse } from "dotenv";

const credentialFile = ".env.admin.local";
const projectId = "prj_5JoU7Cv0X0BiwydQMn8YNjab09cq";
if (!existsSync(credentialFile)) {
  writeFileSync(credentialFile, `ADMIN_USER=akn-admin\nADMIN_PASSWORD=${randomBytes(32).toString("base64url")}\n`, { flag: "wx", mode: 0o600 });
  console.log("Yönetici bilgileri .env.admin.local dosyasında oluşturuldu. Değerler ekrana yazılmadı.");
} else {
  console.log("Mevcut yönetici bilgileri korundu.");
}

if (process.argv.includes("--upload")) {
  const linked = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
  if (linked.projectId !== projectId) throw new Error("Beklenmeyen Vercel projesi; işlem durduruldu.");
  const credentials = parse(readFileSync(credentialFile));
  if (!credentials.ADMIN_USER || (credentials.ADMIN_PASSWORD?.length ?? 0) < 32) throw new Error("Yönetici bilgileri eksik veya zayıf.");
  const cli = join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js");
  for (const name of ["ADMIN_USER", "ADMIN_PASSWORD"]) {
    const result = spawnSync(process.execPath, [cli, "env", "add", name, "production", "--project", projectId, "--scope", "bahadir2", "--yes", "--sensitive"], { input: credentials[name], encoding: "utf8", timeout: 30000 });
    if (result.status !== 0) {
      console.error(`${name} eklenemedi; var olan değerlerin üzerine yazılmadı.`);
      process.exitCode = 1;
    } else console.log(`${name}: AKN üretim ortamına eklendi.`);
  }
}
