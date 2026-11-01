import { neon } from '@neondatabase/serverless'
import { ApiFailure } from './app.ts'
import {
  parseCase,
  type PlayerRecord,
  type PlayerRepository,
  type PlayerWrite,
  type VerifiedUser,
  type WriteResult,
} from './player.ts'

type Row = {
  name: string
  case_data: unknown
  revision: string | number
  generation: string | number
  initialized: boolean
}
function record(row: Row): PlayerRecord {
  const state = parseCase(row.case_data)
  const revision = Number(row.revision),
    generation = Number(row.generation)
  if (!state || !Number.isSafeInteger(revision) || !Number.isSafeInteger(generation))
    throw new Error('Invalid persisted case')
  return { name: row.name, case: state, revision, generation, isNew: !row.initialized }
}
export function createPostgresRepository(connectionString: string): PlayerRepository {
  const sql = neon(connectionString)
  const get = async (user: VerifiedUser): Promise<PlayerRecord> => {
    const safeName =
      user.name
        .trim()
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .slice(0, 32) || 'เจ้าหน้าที่'
    await sql`INSERT INTO techcare_players (user_id, name, case_data)
      VALUES (${user.id}, ${safeName}, '{"version":2,"completed":[],"currentArea":"base"}'::jsonb)
      ON CONFLICT (user_id) DO NOTHING`
    const rows =
      await sql`SELECT name, case_data, revision, generation, initialized FROM techcare_players WHERE user_id = ${user.id}`
    if (!rows[0]) throw new Error('Player row unavailable')
    return record(rows[0] as Row)
  }
  const conflict = async (
    user: VerifiedUser,
    expected: Pick<PlayerWrite, 'revision' | 'generation'>
  ): Promise<WriteResult> => {
    const player = await get(user)
    return {
      ok: false,
      code: player.generation !== expected.generation ? 'RESET_CONFLICT' : 'REVISION_CONFLICT',
      player,
    }
  }
  return {
    get,
    put: async (user, input) => {
      await get(user)
      const rows =
        await sql`UPDATE techcare_players SET name = ${input.name}, case_data = ${JSON.stringify(input.case)}::jsonb,
        revision = revision + 1, initialized = true, updated_at = now()
        WHERE user_id = ${user.id} AND revision = ${input.revision} AND generation = ${input.generation}
          AND case_data->'completed' <@ ${JSON.stringify(input.case.completed)}::jsonb
        RETURNING name, case_data, revision, generation, initialized`
      if (rows[0]) return { ok: true, player: record(rows[0] as Row) }
      const result = await conflict(user, input)
      if (
        !result.ok &&
        result.player.revision === input.revision &&
        result.player.generation === input.generation
      )
        throw new ApiFailure(400, 'MILESTONE_REMOVAL', 'ใช้ปุ่มเริ่มคดีใหม่เมื่อต้องการล้างหลักฐาน')
      return result
    },
    reset: async (user, expected) => {
      await get(user)
      const rows =
        await sql`UPDATE techcare_players SET case_data = '{"version":2,"completed":[],"currentArea":"base"}'::jsonb,
        revision = revision + 1, generation = generation + 1, initialized = true, updated_at = now()
        WHERE user_id = ${user.id} AND revision = ${expected.revision} AND generation = ${expected.generation}
        RETURNING name, case_data, revision, generation, initialized`
      return rows[0] ? { ok: true, player: record(rows[0] as Row) } : conflict(user, expected)
    },
  }
}
