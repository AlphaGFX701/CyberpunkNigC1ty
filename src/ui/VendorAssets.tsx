// Only the loader is an external demo; the two frame accents are original TechCare SVGs.
export const demoAssets = {
  finnLoader: '/assets/vendor/finnmercury/loading-03.png',
  techcareCorner: '/assets/ui/techcare-corner.svg',
  techcareStandby: '/assets/ui/techcare-standby.svg',
} as const

export function DemoLoader() {
  return (
    <span
      className="demo-link-loader"
      style={{ backgroundImage: `url("${demoAssets.finnLoader}")` }}
      aria-hidden="true"
    />
  )
}
export function DemoCorner({ side }: { side: 'left' | 'right' }) {
  return (
    <img
      className={`demo-frame-corner corner-${side}`}
      src={demoAssets.techcareCorner}
      width={48}
      height={48}
      alt=""
      draggable={false}
      aria-hidden="true"
    />
  )
}
export function DemoStandby() {
  return (
    <img
      className="demo-standby"
      src={demoAssets.techcareStandby}
      width={145}
      height={32}
      alt="STANDBY · พักการเชื่อมต่อ"
    />
  )
}
