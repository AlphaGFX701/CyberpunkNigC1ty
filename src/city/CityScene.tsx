import { MapCameraRig } from '../map-camera/MapCameraRig'
import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  type Mesh,
  MOUSE,
  Object3D,
  Shape,
  Vector3,
} from 'three'
import type { OrbitControls as OrbitControlsInstance } from 'three-stdlib'
import { ARCHITECTURE, AREA_LOCATIONS, BANKS, BUILDINGS, ROADS } from './city-layout'
import type { AreaId } from './progression'
import './city-scene.css'

export type CitySceneProps = {
  accessible: readonly AreaId[]
  selected: AreaId | null
  current: AreaId
  onSelect: (id: AreaId) => void
  onReady?: () => void
  onFailure?: (message: string) => void
  paused: boolean
  inputBlocked?: boolean
  reducedMotion: boolean
  resetToken: number
  zoomDelta: number
  turnDelta: number
  controlsLocked?: boolean
  tutorialCamera?: { id: number; kind: 'demo' | 'rotate' | 'zoom' | 'reset' }
  onTutorialCameraDone?: (id: number) => void
  onManualCamera?: (kind: 'rotate' | 'zoom') => void
  onCameraActionDone?: (kind: 'rotate' | 'zoom' | 'reset') => void
}
const START = new Vector3(164, 170, 176)
const ORIGIN = new Vector3(0, 0, 0)
const CAMERA_CONFIG = {
  position: START.toArray() as [number, number, number],
  fov: 38,
  near: 0.1,
  far: 1500,
}
const CYAN = '#7eb7b8',
  AMBER = '#e7bf77'
const isOpen = (area: AreaId | null, accessible: readonly AreaId[]) =>
  area !== null && accessible.includes(area)

function Bank({ points }: { points: [number, number][] }) {
  const shape = useMemo(() => {
    const s = new Shape()
    points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)))
    s.closePath()
    return s
  }, [points])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
      <extrudeGeometry args={[shape, { depth: 0.55, bevelEnabled: false }]} />
      <meshStandardMaterial color="#1b3038" metalness={0.35} roughness={0.8} />
    </mesh>
  )
}
function Road({
  a,
  b,
  width = 2.3,
  bridge = false,
}: {
  a: [number, number]
  b: [number, number]
  width?: number
  bridge?: boolean
}) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    length = Math.hypot(dx, dz)
  return (
    <group
      position={[(a[0] + b[0]) / 2, bridge ? 0.45 : 0.035, (a[1] + b[1]) / 2]}
      rotation={[0, -Math.atan2(dz, dx), 0]}
    >
      <mesh>
        <boxGeometry args={[length, 0.12, width]} />
        <meshStandardMaterial
          color={bridge ? '#47636a' : '#30464d'}
          metalness={0.4}
          roughness={0.75}
        />
      </mesh>
      <mesh position={[0, 0.075, -width * 0.43]}>
        <boxGeometry args={[length, 0.018, 0.035]} />
        <meshBasicMaterial color="#60888b" transparent opacity={0.52} />
      </mesh>
      <mesh position={[0, 0.075, width * 0.43]}>
        <boxGeometry args={[length, 0.018, 0.035]} />
        <meshBasicMaterial color="#60888b" transparent opacity={0.52} />
      </mesh>
      {bridge && (
        <>
          {[-1, 1].map((side) => (
            <group key={side} position={[0, 0.3, side * width * 0.5]}>
              <mesh>
                <boxGeometry args={[length, 0.12, 0.09]} />
                <meshStandardMaterial color="#8aa3a0" />
              </mesh>
              {[-0.35, 0.35].map((v) => (
                <mesh key={v} position={[length * v, -0.6, 0]}>
                  <boxGeometry args={[0.32, 1.8, 0.32]} />
                  <meshStandardMaterial color="#2b454d" />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )}
    </group>
  )
}
function Buildings({
  accessible,
  onSelect,
}: {
  accessible: readonly AreaId[]
  onSelect: (id: AreaId) => void
}) {
  const mesh = useRef<InstancedMesh>(null)
  const roofMesh = useRef<InstancedMesh>(null)
  const windows = useRef<InstancedMesh>(null)
  const roofRecords = useMemo(
    () =>
      BUILDINGS.filter((b) => b.roof > 0).map((b) => ({
        ...b,
        w: b.w * 0.42,
        d: b.d * 0.38,
        h: 0.3,
        x: b.x + b.w * 0.13,
        z: b.z + b.d * 0.1,
        base: b.h,
      })),
    []
  )
  const windowRecords = useMemo(
    () =>
      BUILDINGS.flatMap((b) =>
        Array.from({ length: Math.min(7, Math.max(1, Math.floor(b.h / 1.3))) }, (_, i) => ({
          b,
          y: 0.65 + i * 1.22,
        })).flatMap((r) => [0, 1, 2, 3].map((side) => ({ ...r, side })))
      ),
    []
  )
  useLayoutEffect(() => {
    if (!mesh.current || !roofMesh.current || !windows.current) return
    const dummy = new Object3D()
    BUILDINGS.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2 + 0.12, b.z)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
      const open = isOpen(b.area, accessible) || b.x < -8
      mesh.current!.setColorAt(
        i,
        new Color(
          open
            ? (b.z < -28
                ? ['#637bb0', '#9775ab', '#5b6d9b']
                : b.z > 28
                  ? ['#a66f55', '#a88260', '#47869a']
                  : b.area === 'arun'
                    ? ['#398a9e', '#5472a6', '#81608f']
                    : ['#4c93a1', '#709b96', '#9e7a60'])[b.roof]
            : ['#58646b', '#68777b', '#43545e'][b.roof]
        ).multiplyScalar(0.9 + b.roof * 0.06)
      )
    })
    roofRecords.forEach((b, i) => {
      dummy.position.set(b.x, b.base + b.h / 2 + 0.14, b.z)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      roofMesh.current!.setMatrixAt(i, dummy.matrix)
      roofMesh.current!.setColorAt(
        i,
        new Color(
          isOpen(b.area, accessible) || b.x < -8
            ? b.z < -28
              ? '#a184bb'
              : b.z > 28
                ? '#b67d5a'
                : '#63a2a6'
            : '#46565d'
        )
      )
    })
    windowRecords.forEach(({ b, y, side }, i) => {
      const alongX = side < 2
      dummy.position.set(
        b.x + (alongX ? 0 : (side === 2 ? 1 : -1) * (b.w / 2 + 0.012)),
        y,
        b.z + (alongX ? (side === 0 ? 1 : -1) * (b.d / 2 + 0.012) : 0)
      )
      dummy.scale.set(alongX ? b.w * 0.78 : 0.025, 0.18, alongX ? 0.025 : b.d * 0.78)
      dummy.updateMatrix()
      windows.current!.setMatrixAt(i, dummy.matrix)
      windows.current!.setColorAt(
        i,
        new Color(isOpen(b.area, accessible) ? (i % 17 === 0 ? '#c4a868' : '#284b59') : '#36454e')
      )
    })
    for (const ref of [mesh, roofMesh, windows]) {
      ref.current!.instanceMatrix.needsUpdate = true
      if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true
      ref.current!.computeBoundingSphere()
    }
  }, [accessible, roofRecords, windowRecords])
  const edgeGeometry = useMemo(() => {
    const positions: number[] = [],
      colors: number[] = []
    for (const b of BUILDINGS) {
      const col = new Color(isOpen(b.area, accessible) ? '#70a5aa' : '#50666f')
      const top = b.h + 0.13,
        x0 = b.x - b.w / 2,
        x1 = b.x + b.w / 2,
        z0 = b.z - b.d / 2,
        z1 = b.z + b.d / 2
      const p = [
        [x0, top, z0],
        [x1, top, z0],
        [x1, top, z1],
        [x0, top, z1],
      ]
      for (let n = 0; n < 4; n++) {
        positions.push(...p[n], ...p[(n + 1) % 4])
        colors.push(col.r, col.g, col.b, col.r, col.g, col.b)
      }
      for (const n of [0, 2]) {
        positions.push(...p[n], p[n][0], 0.1, p[n][2])
        colors.push(col.r, col.g, col.b, col.r, col.g, col.b)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    g.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
    return g
  }, [accessible])
  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry])
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined) return
    const area = BUILDINGS[e.instanceId].area
    if (isOpen(area, accessible)) {
      e.stopPropagation()
      onSelect(area!)
    }
  }
  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, BUILDINGS.length]} onClick={click}>
        <boxGeometry />
        <meshStandardMaterial color="white" metalness={0.4} roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={roofMesh} args={[undefined, undefined, roofRecords.length]}>
        <boxGeometry />
        <meshStandardMaterial color="white" metalness={0.45} roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={windows} args={[undefined, undefined, windowRecords.length]}>
        <boxGeometry />
        <meshBasicMaterial color="white" />
      </instancedMesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.65} />
      </lineSegments>
    </>
  )
}
function Box({
  position,
  size,
  color = '#36535e',
}: {
  position: [number, number, number]
  size: [number, number, number]
  color?: string
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.62} />
    </mesh>
  )
}
function Landmarks({ accessible }: { accessible: readonly AreaId[] }) {
  const control = isOpen('control', accessible),
    relay = isOpen('relay', accessible)
  const baseTone = isOpen('base', accessible) ? '#426f78' : '#3b4c54'
  return (
    <>
      <group position={[-31, 0, 22]}>
        <Box position={[0, 1.2, 0]} size={[5.2, 2.4, 4.2]} color={baseTone} />
        <Box position={[0, 2.6, 0]} size={[4.8, 0.45, 4]} color="#617e82" />
        <Box position={[0, 3, 0.1]} size={[1.8, 0.6, 1.7]} color="#3d5963" />
        <Box position={[0, 1.6, 2.13]} size={[3.2, 0.22, 0.08]} color={AMBER} />
      </group>
      <group position={[-24, 0, -8]}>
        <Box position={[0, 1.15, 0]} size={[4.8, 2.3, 3.6]} color="#37616c" />
        <Box position={[0, 2.45, 0]} size={[5.3, 0.4, 4.1]} color="#718f90" />
        <Box position={[0, 1.8, 1.9]} size={[4.3, 0.18, 0.5]} color={AMBER} />
        <Box position={[-1, 2.95, -0.5]} size={[1.6, 0.6, 1.3]} color="#304750" />
      </group>
      <group position={[27, 0, -24]}>
        <Box position={[0, 1.3, 0]} size={[5, 2.6, 4]} color={relay ? '#3a6972' : '#3d4b54'} />
        <mesh position={[0, 6.2, 0]}>
          <cylinderGeometry args={[0.18, 0.65, 8, 6]} />
          <meshStandardMaterial
            color={relay ? '#88b9b9' : '#71828a'}
            metalness={0.55}
            roughness={0.5}
          />
        </mesh>
        {[3.5, 6, 8.5].map((y) => (
          <Box
            key={y}
            position={[0, y, 0]}
            size={[4.2 - y * 0.2, 0.12, 0.16]}
            color={relay ? '#8cbaba' : '#657982'}
          />
        ))}
        <mesh position={[0, 10.7, 0]}>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshBasicMaterial color={relay ? AMBER : '#7e8c8c'} />
        </mesh>
        <mesh position={[1.4, 3.8, 0]} rotation={[0, 0, -0.7]}>
          <cylinderGeometry args={[1.4, 0.35, 0.35, 12, 1, true]} />
          <meshStandardMaterial color={relay ? '#547d84' : '#56666f'} side={DoubleSide} />
        </mesh>
      </group>
      <group position={[25, 0, 15]}>
        <Box position={[0, 1, 0]} size={[7, 2, 7]} color={control ? '#365f6b' : '#36464f'} />
        <Box
          position={[0, 7.3, 0]}
          size={[4.8, 12.5, 4.8]}
          color={control ? '#477887' : '#4a5b66'}
        />
        <Box position={[0, 14, 0]} size={[3.3, 1.2, 3.3]} color={control ? CYAN : '#6d828a'} />
        <mesh position={[0, 16.1, 0]}>
          <coneGeometry args={[2.35, 3.2, 4]} />
          <meshStandardMaterial
            color={control ? '#77aab2' : '#677d86'}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
        {[-1.2, 0, 1.2].map((x) => (
          <Box
            key={x}
            position={[x, 7.5, 2.42]}
            size={[0.06, 10.8, 0.035]}
            color={control ? '#93c8c4' : '#71838a'}
          />
        ))}
      </group>
      {/* Harbour: a projecting wharf, stacked containers and deliberately sparse gantries. */}
      <Box position={[-26, -0.05, 36.5]} size={[34, 0.45, 4]} color="#293f49" />
      {[-38, -26, -14].map((x) => (
        <group key={x} position={[x, 0, 35]}>
          <Box position={[0, 3, 0]} size={[0.22, 6, 0.22]} color="#586e77" />
          <Box position={[2.2, 6, 0]} size={[4.8, 0.23, 0.3]} color="#71818a" />
          <Box position={[4.4, 4.8, 0]} size={[0.06, 2.2, 0.06]} color="#71818a" />
        </group>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          position={[-41 + (i % 6) * 3.3, 0.5, 31.7 + Math.floor(i / 6) * 2.2]}
          size={[2.6, 1, 1.5]}
          color={i % 3 === 0 ? '#6f6654' : '#40565f'}
        />
      ))}
      {/* Eastern utility tanks establish an industrial silhouette distinct from towers. */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[40, 0, 9 + i * 5]}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[1.7, 1.7, 2.8, 16]} />
            <meshStandardMaterial color="#526872" metalness={0.6} roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.7, 0.08, 4, 16]} />
            <meshBasicMaterial color="#7c9095" />
          </mesh>
        </group>
      ))}
    </>
  )
}
type BoxRecord = {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  rotation?: number
}
function BatchBoxes({ records, unlit = false }: { records: BoxRecord[]; unlit?: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    const d = new Object3D()
    records.forEach((r, i) => {
      d.position.set(...r.position)
      d.scale.set(...r.size)
      d.rotation.set(0, r.rotation ?? 0, 0)
      d.updateMatrix()
      ref.current!.setMatrixAt(i, d.matrix)
      ref.current!.setColorAt(i, new Color(r.color))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [records])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, records.length]}>
      <boxGeometry />
      {unlit ? (
        <meshBasicMaterial color="white" />
      ) : (
        <meshStandardMaterial color="white" metalness={0.35} roughness={0.72} />
      )}
    </instancedMesh>
  )
}
function CityArchitecture({
  accessible,
  paused,
  reducedMotion,
}: {
  accessible: readonly AreaId[]
  paused: boolean
  reducedMotion: boolean
}) {
  const records = useMemo(() => {
    const out: BoxRecord[] = []
    const box = (
      position: BoxRecord['position'],
      size: BoxRecord['size'],
      color: string,
      rotation = 0
    ) => out.push({ position, size, color, rotation })
    for (const p of ARCHITECTURE) {
      const active = isOpen(p.area, accessible) || p.x < -8
      const palette = active
        ? {
            concrete: p.z < -25 ? '#8d73a9' : p.z > 34 ? '#a77b5c' : '#65939a',
            glass: p.z < -25 ? '#474a7b' : '#275e7c',
            metal: p.z > 34 ? '#ba8559' : '#4c8797',
            amber: AMBER,
            pink: '#bd728d',
            paving: '#334b50',
          }
        : {
            concrete: '#7b8587',
            glass: '#3e525e',
            metal: '#566971',
            amber: '#8b8d83',
            pink: '#7a737e',
            paving: '#35474d',
          }
      box([p.x, p.y + p.h / 2 + 0.12, p.z], [p.w, p.h, p.d], palette[p.material])
      if (p.floors) {
        const floors = Math.floor(p.h / 1.15)
        for (let floor = 0; floor < floors; floor++) {
          const y = p.y + 0.8 + floor * 1.15
          for (const side of [-1, 1]) {
            box(
              [p.x, y, p.z + side * (p.d / 2 + 0.018)],
              [p.w * 0.94, 0.45, 0.035],
              active ? '#294c5b' : '#344651'
            )
            box(
              [p.x + side * (p.w / 2 + 0.018), y, p.z],
              [0.035, 0.45, p.d * 0.94],
              active ? '#294c5b' : '#344651'
            )
            // Slab edges and regular mullions make the mass read as a building at street scale.
            box(
              [p.x, y - 0.36, p.z + side * (p.d / 2 + 0.04)],
              [p.w + 0.13, 0.095, 0.09],
              active ? (p.z < -25 ? '#9c8abb' : '#91aeaa') : '#919b9b'
            )
            box(
              [p.x + side * (p.w / 2 + 0.04), y - 0.36, p.z],
              [0.09, 0.095, p.d + 0.13],
              active ? (p.z < -25 ? '#9c8abb' : '#91aeaa') : '#919b9b'
            )
          }
        }
        for (let x = -p.w / 2 + 0.6; x < p.w / 2; x += 1.25)
          for (const side of [-1, 1])
            box(
              [p.x + x, p.y + p.h / 2, p.z + side * (p.d / 2 + 0.045)],
              [0.075, p.h - 0.3, 0.055],
              active ? '#78999b' : '#819092'
            )
        for (let z = -p.d / 2 + 0.6; z < p.d / 2; z += 1.25)
          for (const side of [-1, 1])
            box(
              [p.x + side * (p.w / 2 + 0.045), p.y + p.h / 2, p.z + z],
              [0.055, p.h - 0.3, 0.075],
              active ? '#78999b' : '#819092'
            )
        box(
          [p.x, p.y + p.h + 0.2, p.z],
          [p.w + 0.26, 0.18, p.d + 0.26],
          active ? '#94aaa6' : '#879598'
        )
      }
    }
    // Repair-quarter shopfronts: parapets, rolled shutters, varied awnings and window mullions.
    for (const [i, b] of BUILDINGS.entries()) {
      if (b.area !== 'arun' && b.area !== 'base') continue
      const active = isOpen(b.area, accessible),
        trim = active ? '#819a99' : '#718087'
      box([b.x, b.h + 0.22, b.z], [b.w + 0.22, 0.2, b.d + 0.22], trim)
      if (b.h < 3.8) {
        box(
          [b.x, Math.min(1.55, b.h * 0.65), b.z + b.d / 2 + 0.28],
          [b.w * 0.9, 0.12, 0.68],
          active ? (i % 6 === 0 ? '#a75e83' : i % 3 === 0 ? '#ad9c6e' : '#457d84') : '#6d7a7d'
        )
        box([b.x, 0.65, b.z + b.d / 2 + 0.02], [b.w * 0.62, 0.9, 0.04], '#2c4651')
        for (let n = 0; n < 4; n++)
          box([b.x, 0.35 + n * 0.17, b.z + b.d / 2 + 0.05], [b.w * 0.6, 0.035, 0.02], '#647f82')
      }
      for (const side of [-1, 1])
        for (let x = -b.w * 0.3; x < b.w * 0.4; x += 0.55)
          box(
            [b.x + x, b.h * 0.56, b.z + side * (b.d / 2 + 0.035)],
            [0.06, b.h * 0.72, 0.035],
            trim
          )
    }
    // Arun's workshop has an attached parts room, an outdoor bench and illuminated sign frame.
    box([-27.1, 1.1, -8], [1.3, 2.2, 3.7], '#345f6b')
    box([-24, 1.1, -6.14], [2.8, 1.5, 0.035], '#294754')
    for (let x = -25.25; x < -22.6; x += 0.42) box([x, 1.1, -6.1], [0.07, 1.5, 0.05], '#94a3a0')
    box([-22.1, 0.6, -5.4], [1.2, 1.1, 0.55], '#687f81')
    for (const [x, z, y, color] of [
      [-26.8, -7.6, 3.8, '#83c8c3'],
      [-35.4, -15, 4.5, '#c0a373'],
      [-19.8, -10, 4.6, '#bc739a'],
    ] as const) {
      box([x, y - 1.3, z], [0.1, 2.6, 0.1], '#687f86')
      box([x, y, z], [2.4, 1.25, 0.17], '#142c39')
      box([x, y + 0.66, z], [2.6, 0.09, 0.23], color)
      box([x - 1.24, y, z], [0.08, 1.4, 0.23], color)
      box([x + 1.24, y, z], [0.08, 1.4, 0.23], color)
      for (let n = 0; n < 3; n++)
        box([x - 0.55 + n * 0.55, y + 0.12 * (n % 2), z + 0.1], [0.35, 0.14, 0.04], color)
      box([x, y - 0.4, z + 0.1], [1.8, 0.08, 0.035], color)
    }
    // Dashed centre lanes follow actual streets and bridges rather than ornamenting rooftops.
    for (const road of ROADS)
      for (let i = 1; i < road.points.length; i++) {
        const a = road.points[i - 1],
          b = road.points[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = Math.hypot(dx, dz)
        if (!road.primary && !road.bridge) continue
        for (let d = 1; d < length; d += 3)
          box(
            [a[0] + (dx * d) / length, road.bridge ? 0.53 : 0.12, a[1] + (dz * d) / length],
            [0.85, 0.018, 0.055],
            '#718680',
            -Math.atan2(dz, dx)
          )
      }
    for (const [i, x, z] of [
      [0, -38, -0.1],
      [1, -31, 14.2],
      [2, -17, -27.6],
      [3, -66, -3.8],
      [4, 42, -12.8],
      [5, -54, 23.2],
    ] as const) {
      box([x, 0.38, z], [1.7, 0.65, 0.82], i % 2 ? '#566a73' : '#446772')
      box([x, 0.78, z], [0.9, 0.25, 0.7], '#1f3d4b')
      box([x + 0.87, 0.36, z - 0.24], [0.04, 0.12, 0.12], '#d7c597')
      box([x + 0.87, 0.36, z + 0.24], [0.04, 0.12, 0.12], '#d7c597')
    }
    // Central tree-lined court and west-bank green strips.
    for (const [x, z] of [
      [-58, 7],
      [-58, 12],
      [-77, 28],
      [-74, 28],
      [-65, 19],
      [-60, 19],
      [-55, 19],
      [-50, 19],
      [-42, -34],
      [-36, -34],
      [-30, -34],
      [-24, -34],
    ] as const) {
      box([x, 0.5, z], [0.22, 1, 0.22], '#526b60')
      box([x, 1.4, z], [1.2, 1.4, 1.2], '#498471')
    }
    // Median lamps, shop signs and small bays place the human scale beside the larger towers.
    for (let x = -78; x < -17; x += 6) {
      box([x, 0.85, -26.7], [0.08, 1.7, 0.08], '#70898b')
      box([x, 1.7, -26.7], [0.45, 0.12, 0.3], '#c4b37c')
    }
    for (let i = 0; i < 14; i++) {
      const x = -77 + (i % 7) * 3,
        z = 49 + Math.floor(i / 7) * 2.3
      box([x, 0.55, z], [2.5, 1, 1.5], i % 3 ? '#657d83' : '#8b8170')
    }
    for (const x of [-79, -68, -57]) {
      box([x, 4, 55], [0.3, 8, 0.3], '#7b8f92')
      box([x + 3.5, 8, 55], [7.4, 0.3, 0.3], '#9ba5a0')
      box([x + 6.8, 6.4, 55], [0.08, 3.3, 0.08], '#8b9d9e')
    }
    // A coherent elevated rail crosses the west neighbourhood, then curves towards the harbour.
    for (const [a, b] of [
      [
        [-80, 28],
        [-44, 28],
      ],
      [
        [-44, 28],
        [-30, 40],
      ],
      [
        [-30, 40],
        [36, 40],
      ],
      [
        [36, 40],
        [46, 30],
      ],
    ] as [number[], number[]][]) {
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        length = Math.hypot(dx, dz),
        rotation = -Math.atan2(dz, dx)
      box([(a[0] + b[0]) / 2, 3.8, (a[1] + b[1]) / 2], [length, 0.32, 1.25], '#607b80', rotation)
      for (let t = 0.15; t < 1; t += 0.24)
        box([a[0] + dx * t, 1.8, a[1] + dz * t], [0.5, 3.6, 0.5], '#4c626c')
      for (const offset of [-0.4, 0.4])
        box(
          [
            (a[0] + b[0]) / 2 + Math.sin(-rotation) * offset,
            4.02,
            (a[1] + b[1]) / 2 + Math.cos(rotation) * offset,
          ],
          [length, 0.04, 0.055],
          '#9bb4af',
          rotation
        )
    }
    // Rooftop antenna arrays, service rooms and external loading bays.
    for (const [x, z, y] of [
      [54.8, -27, 26],
      [64.8, -25, 21],
      [-58, -33, 13],
      [-65, 7, 7],
      [-51, 7, 7],
      [76, 43, 5.5],
    ] as const) {
      box([x, y + 0.8, z], [1.4, 1.2, 1.8], '#566f76')
      box([x + 0.8, y + 2, z], [0.08, 3, 0.08], '#a2b2b0')
      box([x + 0.8, y + 3, z], [1.6, 0.08, 0.08], '#9eafab')
    }
    return out
  }, [accessible])
  const roof = useMemo(() => {
    const positions: number[] = []
    const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c)
    // North-lit sawtooth factory roofs, deliberately independent of the tower vocabulary.
    for (let i = 0; i < 5; i++) {
      const x = 52.5 + i * 3.4,
        y = 3.55,
        z0 = 37,
        z1 = 49
      const a = [x, y, z0],
        b = [x + 3.4, y, z0],
        c = [x + 2.9, y + 2.2, z0],
        d = [x, y, z1],
        e = [x + 3.4, y, z1],
        f = [x + 2.9, y + 2.2, z1]
      triangle(a, b, c)
      triangle(d, f, e)
      triangle(a, c, f)
      triangle(a, f, d)
      triangle(c, b, e)
      triangle(c, e, f)
    }
    // Long gabled roof planes cap two canal housing wings and the port's old customs hall.
    for (const [x, z, w, d, y] of [
      [-73, 40, 4.4, 10.4, 5.6],
      [-62, -47, 3, 10.4, 6.6],
      [-54, -47, 3, 10.4, 6.6],
    ] as const) {
      const a = [x - w / 2, y, z - d / 2],
        b = [x + w / 2, y, z - d / 2],
        c = [x, y + 1.6, z - d / 2],
        e = [x - w / 2, y, z + d / 2],
        f = [x + w / 2, y, z + d / 2],
        g = [x, y + 1.6, z + d / 2]
      triangle(a, b, c)
      triangle(e, g, f)
      triangle(a, c, g)
      triangle(a, g, e)
      triangle(c, b, f)
      triangle(c, f, g)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    g.computeVertexNormals()
    return g
  }, [])
  useEffect(() => () => roof.dispose(), [roof])
  const train = useRef<import('three').Group>(null)
  const trainTime = useRef(0)
  useFrame(({ invalidate }, delta) => {
    if (!train.current || paused || reducedMotion) return
    trainTime.current += Math.min(delta, 0.05)
    train.current.position.x = -78 + ((trainTime.current * 1.5) % 33)
    invalidate()
  })
  return (
    <>
      <BatchBoxes records={records} />
      <mesh geometry={roof}>
        <meshStandardMaterial color="#839396" roughness={0.7} metalness={0.25} side={DoubleSide} />
      </mesh>
      <group ref={train} position={[-65, 4.4, 28]}>
        {[0, 2.4, 4.8].map((x) => (
          <group key={x}>
            <Box position={[x, 0, 0]} size={[2.2, 0.75, 1]} color="#88a6a7" />
            <Box position={[x, 0.03, 0.51]} size={[1.7, 0.3, 0.03]} color="#d1b779" />
          </group>
        ))}
      </group>
    </>
  )
}
function Pulse({
  position,
  color,
  reduced,
  paused,
}: {
  position: [number, number, number]
  color: string
  reduced: boolean
  paused: boolean
}) {
  const ring = useRef<Mesh>(null)
  useFrame(({ clock, invalidate }) => {
    if (!ring.current || reduced || paused) return
    const k = 1 + (Math.sin(clock.elapsedTime * 1.7) * 0.5 + 0.5) * 0.13
    ring.current.scale.set(k, k, k)
    invalidate()
  })
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.055, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={DoubleSide} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.325, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={DoubleSide} />
      </mesh>
    </group>
  )
}

function ProjectPins({
  refs,
  accessible,
}: {
  refs: RefObject<Record<AreaId, HTMLDivElement | null>>
  accessible: readonly AreaId[]
}) {
  const { camera, size, invalidate } = useThree()
  const v = useMemo(() => new Vector3(), [])
  useEffect(() => {
    invalidate()
  }, [accessible, size, invalidate])
  useFrame(() => {
    for (const id of accessible) {
      const node = refs.current[id]
      if (!node) continue
      const a = AREA_LOCATIONS[id]
      v.set(a.position[0], a.height, a.position[2]).project(camera)
      node.style.left = `${(v.x * 0.5 + 0.5) * size.width}px`
      node.style.top = `${(-v.y * 0.5 + 0.5) * size.height}px`
      node.style.visibility = v.z > -1 && v.z < 1 ? 'visible' : 'hidden'
    }
  })
  return null
}

function CameraRig({
  selected,
  ...props
}: Omit<import('../map-camera/MapCameraRig').MapCameraProps, 'focusPoint'> & {
  selected: AreaId | null
}) {
  const location = selected ? AREA_LOCATIONS[selected].position : null
  return <MapCameraRig {...props} focusPoint={location ? [location[0], 1, location[2]] : null} />
}

class SceneBoundary extends Component<
  { children: ReactNode; onFailure?: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFailure?.('เปิดภาพเมือง 3D ไม่สำเร็จ ยังเลือกสถานที่จากรายการได้')
  }
  render() {
    return this.state.failed ? (
      <div className="city-render-fallback" role="status">
        เปิดภาพเมือง 3D ไม่สำเร็จ ใช้รายการสถานที่เพื่อเล่นต่อได้
      </div>
    ) : (
      this.props.children
    )
  }
}

export default function CityScene(props: CitySceneProps) {
  const { accessible, selected, current, onSelect, paused, reducedMotion } = props
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const pinRefs = useRef<Record<AreaId, HTMLDivElement | null>>({
    base: null,
    arun: null,
    relay: null,
    control: null,
  })
  const drag = useRef({ x: 0, y: 0, distance: 0 })
  const failure = useRef(props.onFailure)
  failure.current = props.onFailure
  const lost = useCallback((event: Event) => {
    event.preventDefault()
    failure.current?.('การแสดงผลเมือง 3D หยุดทำงาน เลือกสถานที่จากรายการได้ตามปกติ')
  }, [])
  useEffect(() => () => canvas.current?.removeEventListener('webglcontextlost', lost), [])
  const select = (id: AreaId) => {
    if (!paused && !props.inputBlocked && accessible.includes(id)) onSelect(id)
  }
  return (
    <div
      ref={root}
      className="city-canvas"
      data-camera-paused={paused || props.inputBlocked}
      data-camera-controls-locked={Boolean(props.controlsLocked)}
      data-city-renderer="three"
      data-city-building-count={BUILDINGS.length + ARCHITECTURE.filter((p) => p.floors).length}
      data-city-map-bounds="182,132"
      onPointerDownCapture={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, distance: 0 }
      }}
      onPointerMoveCapture={(e) => {
        drag.current.distance = Math.max(
          drag.current.distance,
          Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y)
        )
      }}
      onClickCapture={(e) => {
        if (e.detail !== 0 && drag.current.distance > 6) {
          e.stopPropagation()
          e.preventDefault()
        }
        drag.current.distance = 0
      }}
    >
      <SceneBoundary onFailure={props.onFailure}>
        <Canvas
          dpr={[1, 1.5]}
          frameloop={paused ? 'never' : 'demand'}
          camera={CAMERA_CONFIG}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl, scene }) => {
            canvas.current = gl.domElement
            gl.domElement.addEventListener('webglcontextlost', lost)
            scene.background = new Color('#091a24')
            props.onReady?.()
          }}
          fallback={
            <div role="status">เบราว์เซอร์นี้ไม่รองรับภาพ 3D ใช้รายการสถานที่เพื่อเล่นต่อได้</div>
          }
        >
          <ambientLight intensity={1.7} color="#a9c9d0" />
          <directionalLight position={[15, 45, 25]} intensity={2.7} color="#c8d5c6" />
          <directionalLight position={[-30, 15, -20]} intensity={1.2} color="#6ba5bc" />
          <mesh position={[0, -1.35, 0]}>
            <boxGeometry args={[182, 1.6, 132]} />
            <meshStandardMaterial color="#101f2a" metalness={0.7} roughness={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[180, 130]} />
            <meshStandardMaterial color="#12323e" metalness={0.65} roughness={0.35} />
          </mesh>
          <gridHelper
            args={[180, 90, '#34515c', '#1b3a47']}
            position={[0, -0.47, 0]}
            scale={[1, 1, 130 / 180]}
          />
          {BANKS.map((b, i) => (
            <Bank key={i} points={b} />
          ))}
          {ROADS.flatMap((r, i) =>
            r.points
              .slice(1)
              .map((p, j) => (
                <Road key={`${i}-${j}`} a={r.points[j]} b={p} width={r.width} bridge={r.bridge} />
              ))
          )}
          <Buildings accessible={accessible} onSelect={select} />
          <Landmarks accessible={accessible} />
          <CityArchitecture accessible={accessible} paused={paused} reducedMotion={reducedMotion} />
          {(Object.keys(AREA_LOCATIONS) as AreaId[])
            .filter((id) => accessible.includes(id))
            .map((id) => {
              const a = AREA_LOCATIONS[id],
                color = id === current || id === selected ? AMBER : CYAN
              return (
                <group key={id}>
                  <Pulse
                    position={[a.position[0], 0.12, a.position[2]]}
                    color={color}
                    reduced={reducedMotion}
                    paused={paused}
                  />
                </group>
              )
            })}
          <CameraRig
            selected={selected}
            paused={paused || props.inputBlocked === true}
            reducedMotion={reducedMotion}
            resetToken={props.resetToken}
            zoomDelta={props.zoomDelta}
            turnDelta={props.turnDelta}
            rootRef={root}
            controlsLocked={props.controlsLocked}
            tutorialCamera={props.tutorialCamera}
            onTutorialCameraDone={props.onTutorialCameraDone}
            onManualCamera={props.onManualCamera}
            onCameraActionDone={props.onCameraActionDone}
          />
          <ProjectPins refs={pinRefs} accessible={accessible} />
        </Canvas>
      </SceneBoundary>
      <div className="city-pin-overlay">
        {(Object.keys(AREA_LOCATIONS) as AreaId[])
          .filter((id) => accessible.includes(id))
          .map((id) => {
            const a = AREA_LOCATIONS[id]
            return (
              <div
                key={id}
                className="city-pin-anchor"
                ref={(node) => {
                  pinRefs.current[id] = node
                }}
              >
                <button
                  type="button"
                  className="city-pin"
                  data-city-pin={id}
                  data-current={id === current}
                  data-selected={id === selected}
                  aria-label={`เลือก${a.label}บนแผนที่`}
                  onClick={() => select(id)}
                  disabled={paused || props.inputBlocked}
                >
                  <span className="pin-label">
                    {a.label}
                    {id === current && <small>อยู่ที่นี่</small>}
                  </span>
                  <i className="pin-stem" />
                  <i className="pin-head" />
                </button>
              </div>
            )
          })}
      </div>
    </div>
  )
}
