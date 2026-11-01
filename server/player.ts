import { cleanCase, validCase, type CaseData, type PlayerRecord } from '../src/account/contracts.ts'
export type { CaseData, PlayerRecord } from '../src/account/contracts.ts'
export type PlayerWrite = Pick<PlayerRecord, 'name' | 'case' | 'revision' | 'generation'>
export type VerifiedUser = { id: string; name: string; emailVerified: boolean }
export type WriteResult =
  | { ok: true; player: PlayerRecord }
  | {
      ok: false
      code: 'REVISION_CONFLICT' | 'RESET_CONFLICT'
      player: PlayerRecord
    }
export interface PlayerRepository {
  get(user: VerifiedUser): Promise<PlayerRecord>
  put(user: VerifiedUser, input: PlayerWrite): Promise<WriteResult>
  reset(
    user: VerifiedUser,
    expected: Pick<PlayerWrite, 'revision' | 'generation'>
  ): Promise<WriteResult>
}
export { emptyCase } from '../src/account/contracts.ts'
export const validCounter = (v: unknown): v is number =>
  Number.isSafeInteger(v) && (v as number) >= 0
const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === 'object' && !Array.isArray(v))
export function parseCase(value: unknown): CaseData | null {
  return validCase(value) ? cleanCase(value) : null
}
export function parseWrite(value: unknown): PlayerWrite | null {
  if (
    !object(value) ||
    Object.keys(value).some((k) => !['name', 'case', 'revision', 'generation'].includes(k)) ||
    typeof value.name !== 'string' ||
    !validCounter(value.revision) ||
    !validCounter(value.generation)
  )
    return null
  const name = value.name.trim()
  const state = parseCase(value.case)
  if (!name || name.length > 32 || /[\u0000-\u001f\u007f]/.test(name) || !state) return null
  return { name, case: state, revision: value.revision, generation: value.generation }
}
export function parseExpected(value: unknown): Pick<PlayerWrite, 'revision' | 'generation'> | null {
  return object(value) &&
    Object.keys(value).every((k) => ['revision', 'generation'].includes(k)) &&
    validCounter(value.revision) &&
    validCounter(value.generation)
    ? { revision: value.revision, generation: value.generation }
    : null
}
