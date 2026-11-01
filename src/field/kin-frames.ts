/** Normalized 4x4 Kin sheet: the transparent margin is not part of his height.
 * Foot edges are measured from alpha >128 in each 96x128 source frame. */
export const KIN_FRAME = { width: 96, height: 128 } as const
export const KIN_DIRECTIONS = ['down', 'left', 'right', 'up'] as const
export type KinDirection = (typeof KIN_DIRECTIONS)[number]
export const KIN_FOOT_EDGE = [
  122, 122, 122, 122, 122, 122, 122, 122, 122, 122, 122, 122, 122, 122, 122, 122,
] as const
