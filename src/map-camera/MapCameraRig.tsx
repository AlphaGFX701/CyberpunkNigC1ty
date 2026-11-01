import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MOUSE, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsInstance } from 'three-stdlib'

export type CameraAction = 'rotate' | 'zoom' | 'reset'
export type MapCameraProps = {
  focusPoint: readonly [number, number, number] | null
  paused: boolean
  reducedMotion: boolean
  resetToken: number
  zoomDelta: number
  turnDelta: number
  rootRef: RefObject<HTMLDivElement | null>
  controlsLocked?: boolean
  tutorialCamera?: { id: number; kind: 'demo' | CameraAction }
  onTutorialCameraDone?: (id: number) => void
  onManualCamera?: (kind: 'rotate' | 'zoom') => void
  onCameraActionDone?: (kind: CameraAction) => void
  start?: readonly [number, number, number]
  targetBounds?: readonly [number, number]
  focusDistance?: number
}
export function MapCameraRig({
  focusPoint,
  paused,
  reducedMotion,
  resetToken,
  zoomDelta,
  turnDelta,
  rootRef,
  controlsLocked = false,
  tutorialCamera,
  onTutorialCameraDone,
  onManualCamera,
  onCameraActionDone,
  start = [164, 170, 176],
  targetBounds = [82, 58],
  focusDistance: baseFocus = 65,
}: MapCameraProps) {
  const START = useMemo(() => new Vector3(...start), [start[0], start[1], start[2]])
  const ORIGIN = useMemo(() => new Vector3(), [])
  const controls = useRef<OrbitControlsInstance>(null)
  const { camera, invalidate, size } = useThree()
  const fitScale = Math.max(1, 1.3 / Math.max(0.25, size.width / Math.max(1, size.height)))
  const maximumDistance = Math.max(170, START.length() * fitScale * 1.1)
  const focusDistance = Math.max(65, Math.min(130, baseFocus * fitScale * 0.6))
  const tween = useRef<{
    from: Vector3
    to: Vector3
    fromTarget: Vector3
    toTarget: Vector3
    time: number
    completion?:
      { type: 'tutorial'; id: number } | { type: 'action'; kind: 'rotate' | 'zoom' | 'reset' }
  } | null>(null)
  const previous = useRef({ zoomDelta, turnDelta, resetToken })
  const lastTutorial = useRef<number | null>(null)
  const lastSize = useRef({ width: 0, height: 0 })
  const manualStart = useRef<{ azimuth: number; distance: number } | null>(null)
  const manualInput = useRef<'pointer' | 'pan' | 'wheel'>('pointer')
  const callbacks = useRef({
    paused,
    controlsLocked,
    tutorialCamera,
    onTutorialCameraDone,
    onManualCamera,
    onCameraActionDone,
  })
  callbacks.current = {
    paused,
    controlsLocked,
    tutorialCamera,
    onTutorialCameraDone,
    onManualCamera,
    onCameraActionDone,
  }
  const complete = (completion: NonNullable<typeof tween.current>['completion']) => {
    const latest = callbacks.current
    if (!completion || latest.paused) return
    if (completion.type === 'tutorial') {
      if (latest.tutorialCamera?.id === completion.id) latest.onTutorialCameraDone?.(completion.id)
    } else latest.onCameraActionDone?.(completion.kind)
  }
  const write = () => {
    const c = controls.current,
      root = rootRef.current
    if (!c || !root) return
    c.target.x = Math.max(-targetBounds[0], Math.min(targetBounds[0], c.target.x))
    c.target.z = Math.max(-targetBounds[1], Math.min(targetBounds[1], c.target.z))
    c.target.y = Math.max(0, Math.min(12, c.target.y))
    root.dataset.cameraPosition = camera.position
      .toArray()
      .map((n) => n.toFixed(3))
      .join(',')
    root.dataset.cameraTarget = c.target
      .toArray()
      .map((n) => n.toFixed(3))
      .join(',')
    root.dataset.cameraAzimuth = c.getAzimuthalAngle().toFixed(4)
    root.dataset.cameraDistance = camera.position.distanceTo(c.target).toFixed(3)
  }
  const move = (
    to: Vector3,
    target: Vector3,
    completion?: NonNullable<typeof tween.current>['completion']
  ) => {
    if (!controls.current) return
    tween.current = null
    if (reducedMotion && !paused) {
      camera.position.copy(to)
      controls.current.target.copy(target)
      controls.current.update()
      write()
      invalidate()
      complete(completion)
    } else {
      tween.current = {
        from: camera.position.clone(),
        to,
        fromTarget: controls.current.target.clone(),
        toTarget: target,
        time: 0,
        completion,
      }
      invalidate()
    }
  }
  useEffect(() => {
    if (focusPoint) {
      const p = focusPoint
      const target = new Vector3(p[0], 1, p[2])
      const direction = camera.position
        .clone()
        .sub(controls.current?.target ?? ORIGIN)
        .normalize()
      move(target.clone().add(direction.multiplyScalar(focusDistance)), target)
    }
  }, [focusPoint?.[0], focusPoint?.[1], focusPoint?.[2]])
  useEffect(() => {
    const old = previous.current,
      c = controls.current
    if (!c) return
    if (resetToken !== old.resetToken)
      move(START.clone().multiplyScalar(fitScale), ORIGIN.clone(), {
        type: 'action',
        kind: 'reset',
      })
    else if (zoomDelta !== old.zoomDelta) {
      const target = c.target.clone()
      const direction = camera.position.clone().sub(target)
      const distance = Math.max(
        35,
        Math.min(maximumDistance, direction.length() * Math.pow(0.86, zoomDelta - old.zoomDelta))
      )
      if (Math.abs(distance - direction.length()) > 0.005)
        move(target.clone().add(direction.normalize().multiplyScalar(distance)), target, {
          type: 'action',
          kind: 'zoom',
        })
    } else if (turnDelta !== old.turnDelta) {
      const target = c.target.clone(),
        offset = camera.position.clone().sub(target)
      offset.applyAxisAngle(new Vector3(0, 1, 0), ((turnDelta - old.turnDelta) * Math.PI) / 6)
      move(target.clone().add(offset), target, { type: 'action', kind: 'rotate' })
    }
    previous.current = { zoomDelta, turnDelta, resetToken }
  }, [zoomDelta, turnDelta, resetToken])
  useEffect(() => {
    const c = controls.current
    if (!c) return
    if (lastSize.current.width === size.width && lastSize.current.height === size.height) return
    // Leave a paused pose alone. The new layout is fitted when the session resumes.
    if (paused) return
    lastSize.current = { width: size.width, height: size.height }
    if (tween.current?.completion?.type === 'tutorial') lastTutorial.current = null
    tween.current = null
    if (focusPoint) {
      const p = focusPoint,
        target = new Vector3(p[0], 1, p[2])
      camera.position.copy(
        target.clone().add(START.clone().normalize().multiplyScalar(focusDistance))
      )
      c.target.copy(target)
    } else {
      camera.position.copy(START.clone().multiplyScalar(fitScale))
      c.target.copy(ORIGIN)
    }
    c.update()
    write()
    invalidate()
  }, [size.width, size.height, paused])
  useEffect(() => {
    const command = tutorialCamera,
      c = controls.current
    if (!command) {
      if (tween.current?.completion?.type === 'tutorial') tween.current = null
      return
    }
    if (paused || !c || lastTutorial.current === command.id) return
    lastTutorial.current = command.id
    const completion = { type: 'tutorial' as const, id: command.id }
    if (command.kind === 'reset') {
      move(START.clone().multiplyScalar(fitScale), ORIGIN.clone(), completion)
    } else {
      const target = c.target.clone(),
        offset = camera.position.clone().sub(target)
      if (command.kind === 'zoom') {
        const distance = Math.max(35, Math.min(maximumDistance, offset.length() * 0.86))
        offset.normalize().multiplyScalar(distance)
      } else offset.applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 6)
      move(target.clone().add(offset), target, completion)
    }
  }, [tutorialCamera?.id, paused, size.width, size.height])
  useEffect(() => {
    const c = controls.current
    if (!c) return
    if (paused || controlsLocked) {
      manualStart.current = null
      // Flush pending damping without changing the camera when a modal takes input.
      const position = camera.position.clone(),
        target = c.target.clone()
      c.enableDamping = false
      c.update()
      camera.position.copy(position)
      c.target.copy(target)
      c.update()
      write()
    } else c.enableDamping = !reducedMotion
    if (!paused) {
      if (reducedMotion && tween.current) {
        const completion = tween.current.completion
        camera.position.copy(tween.current.to)
        c.target.copy(tween.current.toTarget)
        tween.current = null
        c.update()
        write()
        complete(completion)
      }
      invalidate()
    }
  }, [paused, reducedMotion, controlsLocked, invalidate])
  useEffect(() => {
    write()
  }, [])
  useEffect(() => {
    const element = controls.current?.domElement
    if (!element) return
    const pointer = (event: PointerEvent) => {
      manualInput.current = event.button === 2 ? 'pan' : 'pointer'
    }
    const wheel = () => {
      manualInput.current = 'wheel'
    }
    element.addEventListener('pointerdown', pointer, true)
    element.addEventListener('wheel', wheel, { capture: true, passive: true })
    return () => {
      element.removeEventListener('pointerdown', pointer, true)
      element.removeEventListener('wheel', wheel, true)
    }
  }, [])
  useFrame((_, delta) => {
    const t = tween.current,
      c = controls.current
    if (!t || !c || paused) return
    t.time += Math.min(delta, 0.05)
    const p = Math.min(1, t.time / 0.55),
      e = 1 - Math.pow(1 - p, 3)
    camera.position.lerpVectors(t.from, t.to, e)
    c.target.lerpVectors(t.fromTarget, t.toTarget, e)
    c.update()
    write()
    if (p === 1) {
      tween.current = null
      complete(t.completion)
    } else invalidate()
  })
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!paused && !controlsLocked}
      enableDamping={!reducedMotion && !controlsLocked}
      dampingFactor={0.12}
      minDistance={35}
      maxDistance={maximumDistance}
      minPolarAngle={Math.PI / 9}
      maxPolarAngle={Math.PI * 0.365}
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}
      zoomSpeed={0.7}
      rotateSpeed={0.65}
      panSpeed={0.7}
      mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
      onStart={() => {
        if (callbacks.current.paused || callbacks.current.controlsLocked || !controls.current)
          return
        tween.current = null
        manualStart.current = {
          azimuth: controls.current.getAzimuthalAngle(),
          distance: camera.position.distanceTo(controls.current.target),
        }
      }}
      onEnd={() => {
        const start = manualStart.current,
          c = controls.current,
          latest = callbacks.current,
          input = manualInput.current
        manualStart.current = null
        manualInput.current = 'pointer'
        if (!start || !c || input === 'pan' || latest.paused || latest.controlsLocked) return
        const azimuth = c.getAzimuthalAngle(),
          angle = Math.abs(
            Math.atan2(Math.sin(azimuth - start.azimuth), Math.cos(azimuth - start.azimuth))
          ),
          distance = camera.position.distanceTo(c.target)
        if (Math.abs(distance - start.distance) > 0.05) latest.onManualCamera?.('zoom')
        else if (angle > 0.001) latest.onManualCamera?.('rotate')
      }}
      onChange={write}
    />
  )
}
