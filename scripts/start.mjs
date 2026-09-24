import nextEnv from "@next/env";
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
// Load the project environment before the standalone server changes its working directory.
nextEnv.loadEnvConfig(process.cwd());
const output = resolve(".next/standalone");
if (!existsSync(`${output}/server.js`)) throw new Error("Önce npm run build çalıştırın.");
cpSync("public", `${output}/public`, { recursive: true });
cpSync(".next/static", `${output}/.next/static`, { recursive: true });
const child=spawn(process.execPath,[`${output}/server.js`],{stdio:"inherit",env:{...process.env,HOSTNAME:process.env.HOSTNAME||"0.0.0.0"}});
for(const signal of ["SIGINT","SIGTERM"])process.on(signal,()=>child.kill(signal));
child.on("exit",code=>process.exit(code??0));
