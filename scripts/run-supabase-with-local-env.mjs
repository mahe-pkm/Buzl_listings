import { spawn } from "node:child_process";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.SEND_SMS_HOOK_SECRETS?.trim()) {
  throw new Error(
    "SEND_SMS_HOOK_SECRETS is required; run npm run local:auth-hook:configure first"
  );
}

const args = process.argv.slice(2);
if (args.length === 0) {
  throw new Error("A Supabase CLI command is required");
}

const windows = process.platform === "win32";
const executable = windows ? process.env.ComSpec ?? "cmd.exe" : "npx";
const commandArgs = windows
  ? ["/d", "/s", "/c", "npx.cmd", "supabase", ...args]
  : ["supabase", ...args];
const child = spawn(executable, commandArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  shell: false,
});

child.on("error", () => {
  console.error("Unable to start the Supabase CLI");
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
