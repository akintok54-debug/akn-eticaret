import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const expectedProject = "prj_5JoU7Cv0X0BiwydQMn8YNjab09cq";
const linked = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
if (linked.projectId !== expectedProject) throw new Error("Wrong project; stopped.");
const cli = join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js");
const variables = {
  SITE_URL: "https://www.aknmotosiklet.com",
  CHECKOUT_ENABLED: "false",
  SESSION_SECRET: randomBytes(48).toString("hex"),
};
for (const [name, value] of Object.entries(variables)) {
  const result = spawnSync(process.execPath, [cli,"env","add",name,"production","--scope","bahadir2","--project",expectedProject,"--yes",...(name === "SESSION_SECRET" ? ["--sensitive"] : [])], {input:value, encoding:"utf8",timeout:30000});
  if (result.status !== 0) { console.error(`${name}: could not be added; existing values were not overwritten.`);process.exitCode=1; }
  else console.log(`${name}: configured`);
}
