import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'
import { neon } from '@neondatabase/serverless'

const fileEnv: Record<string, string> = {}
for (const name of ['.env', '.env.local']) {
  const envPath = resolve(name)
  if (existsSync(envPath)) Object.assign(fileEnv, parseEnv(readFileSync(envPath, 'utf8')))
}
for (const [key, value] of Object.entries(fileEnv))
  if (process.env[key] === undefined) process.env[key] = value
if (!process.env.DATABASE_URL)
  throw new Error('DATABASE_URL is required; configure .env.local first')
const sql = neon(process.env.DATABASE_URL)
const migration = readFileSync(new URL('../migrations/001_accounts.sql', import.meta.url), 'utf8')
// The SQL is a fixed project file, never user input. It does not alter Neon Auth tables.
const statements = migration
  .split('-- techcare:statement')
  .map((part) => part.trim())
  .filter((part) => part && part !== 'BEGIN;' && part !== 'COMMIT;')
await sql.transaction(statements.map((statement) => sql.query(statement)))
console.log('TechCare account migration applied (connection credentials omitted).')
