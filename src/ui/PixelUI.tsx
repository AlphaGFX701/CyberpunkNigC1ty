import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
} from 'react'
import manifest from './manifest.generated.json'

export const uiManifest = manifest
export type SpriteName = keyof typeof manifest.sprites
export function spriteUrl(name: SpriteName) {
  return manifest.sprites[name].file
}
type Vars = CSSProperties & Record<`--${string}`, string | number>
function frameStyle(name: SpriteName, scale = 2): Vars {
  const s = manifest.sprites[name]
  const slice = s.nineSlice
  return {
    '--pixel-image': `url("${s.file}")`,
    '--pixel-slice': slice ? `${slice.top} ${slice.right} ${slice.bottom} ${slice.left}` : '0',
    '--pixel-border': slice
      ? `${slice.top * scale}px ${slice.right * scale}px ${slice.bottom * scale}px ${slice.left * scale}px`
      : '0',
  }
}
export type ButtonKind = 'primary' | 'secondary' | 'solution' | 'icon'
export function PixelIcon({
  name,
  size = 24,
  className = '',
}: {
  name: SpriteName
  size?: number
  className?: string
}) {
  return (
    <span
      className={`pixel-icon ${className}`}
      style={{ width: size, height: size, backgroundImage: `url("${spriteUrl(name)}")` }}
      aria-hidden="true"
    />
  )
}
export function PixelButton({
  variant = 'secondary',
  icon,
  feedback,
  children,
  className = '',
  style,
  onClick,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonKind
  icon?: SpriteName
  feedback?: 'menu'
}) {
  const vars: Vars = {
    ...frameStyle(`button-${variant}-normal`),
    '--button-hover': `url("${spriteUrl(`button-${variant}-hover`)}")`,
    '--button-down': `url("${spriteUrl(`button-${variant}-pressed`)}")`,
    '--button-disabled': `url("${spriteUrl(`button-${variant}-disabled`)}")`,
    ...style,
  }
  return (
    <button
      {...props}
      type={type}
      data-feedback={feedback}
      onClick={onClick}
      className={`pixel-button pixel-${variant === 'icon' ? 'icon-button' : variant} ${className}`}
      style={vars}
    >
      {icon && <PixelIcon name={icon} />}
      <span className="button-copy">{children}</span>
    </button>
  )
}
export type PanelKind =
  'window' | 'dialogue' | 'objective' | 'tooltip' | 'inventory' | 'minimap' | 'keycap'
export const PixelPanel = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { variant?: PanelKind }
>(function PixelPanel({ variant = 'window', className = '', style, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={`pixel-panel panel-${variant} ${className}`}
      style={{ ...frameStyle(`panel-${variant}`), ...style }}
    />
  )
})
export function PixelBar({
  kind = 'progress',
  value,
  max = 100,
  label,
  segments = 1,
}: {
  kind?: 'progress' | 'boss' | 'shield'
  value: number
  max?: number
  label: string
  segments?: number
}) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0))
  return (
    <div
      className={`pixel-bar bar-${kind}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(ratio * max)}
      style={frameStyle(`bar-${kind}-frame`)}
    >
      <div className="bar-track">
        <span
          className="bar-fill"
          style={{
            width: `${ratio * 100}%`,
            backgroundImage: `url("${spriteUrl(`bar-${kind}-fill`)}")`,
          }}
        />
        {Array.from({ length: Math.max(0, segments - 1) }, (_, i) => (
          <i className="bar-divider" key={i} style={{ left: `${((i + 1) / segments) * 100}%` }} />
        ))}
      </div>
    </div>
  )
}
export function PixelShields({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="pixel-shields" role="img" aria-label={`โล่ ${value} จาก ${max} ช่อง`}>
      {Array.from({ length: max }, (_, i) => (
        <img
          key={i}
          width={32}
          height={32}
          src={spriteUrl(i < value ? 'shield-full' : 'shield-empty')}
          alt=""
        />
      ))}
    </span>
  )
}
export function PixelSlot({
  state = 'normal',
  icon,
  label,
}: {
  state?: 'normal' | 'selected' | 'locked'
  icon?: SpriteName
  label: string
}) {
  return (
    <div
      className={`pixel-slot slot-${state}`}
      role="img"
      aria-label={label}
      style={{ backgroundImage: `url("${spriteUrl(`slot-${state}`)}")` }}
    >
      {state !== 'locked' && icon && <PixelIcon name={icon} size={32} />}
    </div>
  )
}
export function PixelKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="pixel-key" style={frameStyle('panel-keycap', 1)}>
      {children}
    </kbd>
  )
}
