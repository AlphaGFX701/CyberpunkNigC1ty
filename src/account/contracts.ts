export type AreaId = 'base' | 'arun' | 'relay' | 'control'
export type Milestone = 'recover-cam07' | 'read-relay' | 'recover-relay' | 'read-control'
export type CaseData = { version: 2; completed: Milestone[]; currentArea: AreaId }
/** v1 read flags are historical intelligence, never proof of a played relay chapter. */
export type CaseInput = { version: 1 | 2; completed: readonly Milestone[]; currentArea: AreaId }
export type PlayerRecord = {
  name: string
  case: CaseData
  revision: number
  generation: number
  isNew: boolean
}
export const milestoneOrder: readonly Milestone[] = [
  'recover-cam07',
  'read-relay',
  'recover-relay',
  'read-control',
]
export const emptyCase = (): CaseData => ({ version: 2, completed: [], currentArea: 'base' })
export function validCase(value: unknown): value is CaseInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as CaseInput
  if (
    ![1, 2].includes(v.version) ||
    !Array.isArray(v.completed) ||
    v.completed.length > milestoneOrder.length ||
    v.completed.some((x) => !milestoneOrder.includes(x)) ||
    new Set(v.completed).size !== v.completed.length ||
    !['base', 'arun', 'relay', 'control'].includes(v.currentArea)
  )
    return false
  if (v.version === 1 && v.completed.includes('recover-relay')) return false
  if (v.completed.includes('read-relay') && !v.completed.includes('recover-cam07')) return false
  if (v.completed.includes('recover-relay') && !v.completed.includes('recover-cam07')) return false
  if (
    v.completed.includes('read-control') &&
    !v.completed.includes('read-relay') &&
    !v.completed.includes('recover-relay')
  )
    return false
  if (v.currentArea === 'relay' && !v.completed.includes('recover-cam07')) return false
  if (
    v.currentArea === 'control' &&
    !(v.version === 1 ? v.completed.includes('read-relay') : v.completed.includes('recover-relay'))
  )
    return false
  return true
}
export function cleanCase(value: CaseInput): CaseData {
  return {
    version: 2,
    completed: milestoneOrder.filter((x) => value.completed.includes(x)),
    currentArea:
      value.currentArea === 'control' && !value.completed.includes('recover-relay')
        ? value.completed.includes('recover-cam07')
          ? 'relay'
          : 'base'
        : value.currentArea,
  }
}
export const validName = (name: unknown): name is string =>
  typeof name === 'string' && name.trim().length > 0 && name.length <= 32
export function validPlayer(value: unknown): value is PlayerRecord {
  if (!value || typeof value !== 'object') return false
  const p = value as PlayerRecord
  return (
    validName(p.name) &&
    validCase(p.case) &&
    Number.isSafeInteger(p.revision) &&
    p.revision >= 0 &&
    Number.isSafeInteger(p.generation) &&
    p.generation >= 0 &&
    typeof p.isNew === 'boolean'
  )
}
export function mergeProgress(local: CaseInput, remote: CaseInput): CaseData {
  return cleanCase({
    version: 2,
    completed: milestoneOrder.filter(
      (x) => local.completed.includes(x) || remote.completed.includes(x)
    ),
    currentArea: remote.currentArea,
  })
}
