import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const netlifyTomlPath = path.join(rootDir, "netlify.toml");
const envLocalPath = path.join(rootDir, ".env.local");
const packageJsonPath = path.join(rootDir, "package.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function statusLabel(ok) {
  return ok ? "OK" : "MISSING";
}

function outputRow(label, ok, detail) {
  const padded = `${statusLabel(ok)}`.padEnd(7, " ");
  console.log(`${padded} ${label}${detail ? ` - ${detail}` : ""}`);
}

function resolveEnvValue(key, envFileValues) {
  return process.env[key] || envFileValues[key] || "";
}

function hasValue(value) {
  return Boolean(value && String(value).trim());
}

function main() {
  const envFileValues = parseEnvFile(envLocalPath);
  const packageJson = readJson(packageJsonPath);
  const buildScript = packageJson.scripts?.build;
  const nodeVersion = packageJson.engines?.node;

  console.log("Xfitness Netlify readiness check");
  console.log("");

  console.log("Project");
  outputRow("netlify.toml", fs.existsSync(netlifyTomlPath), fs.existsSync(netlifyTomlPath) ? "present" : "missing");
  outputRow("build script", buildScript === "next build", buildScript || "not set");
  outputRow("Node version pin", hasValue(nodeVersion), nodeVersion || "missing");
  console.log("");

  const requiredForLive = [
    ["NEXT_PUBLIC_SUPABASE_URL", "live Supabase auth and data"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "live Supabase auth and data"]
  ];
  const optionalButRecommended = [
    ["NEXT_PUBLIC_ONESIGNAL_APP_ID", "browser push notifications"],
    ["NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY", "live Flutterwave checkout"],
    ["FLUTTERWAVE_SECRET_KEY", "server-side payment verification"]
  ];

  console.log("Environment variables");
  for (const [key, reason] of requiredForLive) {
    outputRow(key, hasValue(resolveEnvValue(key, envFileValues)), reason);
  }
  for (const [key, reason] of optionalButRecommended) {
    const value = resolveEnvValue(key, envFileValues);
    outputRow(key, hasValue(value), `${reason}${hasValue(value) ? "" : " (optional for demo fallback)"}`);
  }
  console.log("");

  console.log("Netlify dashboard checklist");
  console.log("1. Import the repo and keep Next.js framework detection enabled.");
  console.log("2. Use `npm run build` as the build command.");
  console.log("3. Leave the publish directory empty for Next.js.");
  console.log("4. Add the environment variables listed above in Site configuration.");
  console.log("5. If Supabase email confirmation is on, set the production Netlify URL in Supabase Auth URL configuration.");
  console.log("6. If you use OneSignal or Flutterwave live, allow the Netlify production domain in those dashboards too.");
  console.log("");

  const missingRequired = requiredForLive.some(([key]) => !hasValue(resolveEnvValue(key, envFileValues)));

  if (missingRequired) {
    console.log("Result");
    console.log("The app can still deploy in demo fallback mode, but live auth and database features are not fully configured yet.");
    process.exitCode = 0;
    return;
  }

  console.log("Result");
  console.log("Core Netlify deployment settings look ready. Live extras depend on the optional service keys above.");
}

main();
