// Applies a SQL migration to the Supabase Postgres database.
// Usage: node --env-file=.env.local scripts/apply-migration.mjs [path-to-sql]
// Defaults to supabase/migrations/0001_init.sql.
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sqlPath = process.argv[2] ?? "supabase/migrations/0001_init.sql";
const sql = readFileSync(sqlPath, "utf8");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;
if (!url || !password) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD.");
  process.exit(1);
}

const ref = new URL(url).hostname.split(".")[0];

// Direct host is IPv6-only on newer projects; the session pooler is the IPv4
// path but is region-specific. Try the direct host, then sweep pooler regions.
const regions = process.env.SUPABASE_DB_REGION
  ? [process.env.SUPABASE_DB_REGION]
  : [
      "us-east-1", "us-east-2", "us-west-1", "us-west-2",
      "eu-central-1", "eu-central-2", "eu-west-1", "eu-west-2", "eu-west-3",
      "eu-north-1", "ca-central-1", "sa-east-1", "ap-south-1",
      "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
    ];
const poolerPrefixes = ["aws-0", "aws-1"];

const candidates = [
  {
    label: "direct db host",
    config: {
      host: `db.${ref}.supabase.co`,
      port: 5432,
      user: "postgres",
      database: "postgres",
      password,
      ssl: { rejectUnauthorized: false },
    },
  },
  ...poolerPrefixes.flatMap((prefix) =>
    regions.map((region) => ({
      label: `session pooler (${prefix}-${region})`,
      config: {
        host: `${prefix}-${region}.pooler.supabase.com`,
        port: 5432,
        user: `postgres.${ref}`,
        database: "postgres",
        password,
        ssl: { rejectUnauthorized: false },
      },
    })),
  ),
];

let lastErr;
for (const { label, config } of candidates) {
  const client = new Client({ ...config, connectionTimeoutMillis: 10000 });
  try {
    process.stdout.write(`Trying ${label}… `);
    await client.connect();
    console.log("connected.");
    await client.query(sql);
    console.log(`✓ Migration applied via ${label}.`);
    await client.end();
    process.exit(0);
  } catch (err) {
    lastErr = err;
    console.log(`failed (${err.code ?? err.message}).`);
    try {
      await client.end();
    } catch {}
  }
}

console.error("\nCould not apply migration automatically.");
console.error(lastErr?.message ?? lastErr);
console.error(
  "\nFallback: open Supabase → SQL Editor and run the contents of\n  " +
    sqlPath,
);
process.exit(1);
