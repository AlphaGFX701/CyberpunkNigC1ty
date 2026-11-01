import { useCallback, useEffect, useMemo, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Billboard, useTexture } from '@react-three/drei'
import { Color, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { MapCameraRig } from '../map-camera/MapCameraRig'
import { buildCircuitModel, CIRCUIT_STAGES, type CircuitStage } from './model-geometry'
import { buildRelayModel, RELAY_STAGES } from './relay-geometry'
import type { CircuitChapterId } from './chapter-adapter'

type Props = {
  chapterId?: CircuitChapterId
  completed: readonly number[]
  selected: number | null
  current: number
  paused: boolean
  inputBlocked?: boolean
  reducedMotion: boolean
  turnDelta: number
  zoomDelta: number
  resetToken: number
  onSelect: (stage: number) => void
  onReady: () => void
  onFailure: (reason?: string) => void
}
function Officer({ current, stages }: { current: number; stages: readonly CircuitStage[] }) {
  const image = useTexture('/assets/entry/kin.png')
  const node = stages[Math.min(current, 7)]
  return (
    <Billboard position={[node.x + 8, 4, node.z + 8]}>
      <mesh>
        <planeGeometry args={[3, 6]} />
        <meshBasicMaterial map={image} transparent alphaTest={0.1} depthWrite={false} />
      </mesh>
    </Billboard>
  )
}
function City({
  completed,
  current,
  onSelect,
  paused,
  inputBlocked,
  reducedMotion,
  chapterId = 'arun',
}: Props) {
  const stages = chapterId === 'relay' ? RELAY_STAGES : CIRCUIT_STAGES
  const scene = useMemo(
    () => (chapterId === 'relay' ? buildRelayModel : buildCircuitModel)(completed, current),
    [completed, current, chapterId]
  )
  const clock = useRef(0)
  const packet = useRef<Mesh>(null)
  useEffect(
    () => () =>
      scene.root.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose()
          const list = Array.isArray(object.material) ? object.material : [object.material]
          list.forEach((m) => m.dispose())
        }
      }),
    [scene]
  )
  useFrame((_, delta) => {
    if (!paused && !reducedMotion) clock.current += Math.min(delta, 0.05)
    scene.fans.forEach((fan, i) => {
      fan.rotation.y = reducedMotion ? 0 : clock.current * (0.7 + i * 0.07)
    })
    scene.effects.forEach((mesh, i) => {
      ;(mesh.material as MeshStandardMaterial).emissiveIntensity = reducedMotion
        ? 0.5
        : 0.5 + Math.sin(clock.current * 2 + i) * 0.25
    })
    const from = stages[Math.max(0, Math.min(6, current - 1))],
      to = stages[Math.min(7, current)]
    const progress = reducedMotion ? 0.5 : (clock.current * 0.24) % 1
    const middle = (from.z + to.z) / 2,
      vertical = Math.abs(middle - from.z),
      horizontal = Math.abs(to.x - from.x)
    const distance = progress * (vertical * 2 + horizontal)
    const x =
      distance < vertical
        ? from.x
        : distance < vertical + horizontal
          ? from.x + Math.sign(to.x - from.x) * (distance - vertical)
          : to.x
    const z =
      distance < vertical
        ? from.z + Math.sign(middle - from.z) * distance
        : distance < vertical + horizontal
          ? middle
          : middle + Math.sign(to.z - middle) * (distance - vertical - horizontal)
    packet.current?.position.set(x, 0.9, z)
  })
  const select = (event: ThreeEvent<MouseEvent>) => {
    if (paused || inputBlocked || event.delta > 6) return
    let object = event.object
    while (object.parent && typeof object.userData.stage !== 'number') object = object.parent
    const id = object.userData.stage
    if (typeof id === 'number' && id <= current) {
      event.stopPropagation()
      onSelect(id)
    }
  }
  return (
    <>
      <primitive object={scene.root} onClick={select} />
      <mesh ref={packet}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshBasicMaterial color="#aaffeb" />
      </mesh>
      <Suspense fallback={null}>
        <Officer current={current} stages={stages} />
      </Suspense>
    </>
  )
}
function ProjectPins({
  refs,
  stages,
}: {
  refs: React.RefObject<(HTMLDivElement | null)[]>
  stages: readonly CircuitStage[]
}) {
  const { camera, size } = useThree()
  const point = useMemo(() => new Vector3(), [])
  useFrame(() => {
    stages.forEach((stage, index) => {
      const element = refs.current[index]
      if (!element) return
      point.set(stage.x, [15, 17, 22, 16, 22, 22, 17, 26][index], stage.z).project(camera)
      element.style.left = `${(point.x * 0.5 + 0.5) * size.width}px`
      element.style.top = `${(-point.y * 0.5 + 0.5) * size.height}px`
      element.style.visibility = point.z > -1 && point.z < 1 ? 'visible' : 'hidden'
    })
  })
  return null
}
export default function CircuitScene(props: Props) {
  const stages = props.chapterId === 'relay' ? RELAY_STAGES : CIRCUIT_STAGES
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement | null>(null)
  const pinRefs = useRef<(HTMLDivElement | null)[]>([])
  const failure = useRef(props.onFailure)
  failure.current = props.onFailure
  const lost = useCallback((event: Event) => {
    event.preventDefault()
    failure.current('webgl-context-lost')
  }, [])
  useEffect(() => () => canvas.current?.removeEventListener('webglcontextlost', lost), [lost])
  const focus = useMemo(
    () =>
      props.selected === null
        ? null
        : ([stages[props.selected].x, 1, stages[props.selected].z] as const),
    [props.selected, stages]
  )
  return (
    <div
      ref={root}
      className="circuit-canvas"
      data-camera-paused={props.paused || props.inputBlocked}
    >
      <Canvas
        camera={{ position: [112, 112, 126], fov: 38, near: 0.1, far: 900 }}
        dpr={[1, 1.5]}
        frameloop={props.paused ? 'never' : 'always'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          canvas.current = gl.domElement
          gl.domElement.addEventListener('webglcontextlost', lost)
          scene.background = new Color('#06181e')
          props.onReady()
        }}
        fallback={<div role="status">ภาพสามมิติใช้ไม่ได้ เลือกด่านจากรายการได้</div>}
      >
        <ambientLight intensity={1.5} color="#c3dfda" />
        <directionalLight position={[20, 55, 25]} intensity={3} color="#e8f1e7" />
        <directionalLight position={[-30, 15, -20]} intensity={1.1} color="#65bfd5" />
        <City {...props} />
        <MapCameraRig
          focusPoint={focus}
          paused={props.paused || props.inputBlocked === true}
          reducedMotion={props.reducedMotion}
          rootRef={root}
          resetToken={props.resetToken}
          zoomDelta={props.zoomDelta}
          turnDelta={props.turnDelta}
          start={[112, 112, 126]}
          targetBounds={[48, 35]}
          focusDistance={180}
        />
        <ProjectPins refs={pinRefs} stages={stages} />
      </Canvas>
      <div className="circuit-pin-overlay">
        {stages.map((stage, index) => (
          <div
            className="circuit-pin-anchor"
            key={stage.short}
            ref={(element) => {
              pinRefs.current[index] = element
            }}
          >
            <button
              className="circuit-pin"
              data-stage={index + 1}
              data-selected={props.selected === index}
              data-done={props.completed.includes(index)}
              data-active={index === props.current}
              disabled={props.paused || props.inputBlocked || index > props.current}
              data-tutorial-target={index === 0 ? 'circuit-stage-0' : undefined}
              onClick={() => props.onSelect(index)}
              aria-label={`ด่าน ${index + 1} ${stage.title}${index > props.current ? ' ยังล็อก' : ''}`}
            >
              <b>{props.completed.includes(index) ? '✓' : String(index + 1).padStart(2, '0')}</b>
              <span>{stage.short}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
