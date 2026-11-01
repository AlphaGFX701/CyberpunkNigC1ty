import Phaser from 'phaser'
import { chapter, type ChapterSnapshot } from './model'
import { streetPoints, streetSize } from './layout'

export const chapterTextureManifest: Record<string, string> = {
  'chapter-street': '/assets/chapter-one/scenes/arun-workshop.webp',
  'chapter-arun': '/assets/chapter-one/characters/arun-standing.webp',
  'chapter-machine': '/assets/chapter-one/vendor/sakpix/machine.png',
  'chapter-skyline-reflection': '/assets/chapter-one/vendor/neon-city/neon_city_night_L1_far_buildings.png',
}

type Drawing = { update: (time: number, delta: number, reduced: boolean, paused: boolean) => void }
type Target = keyof typeof streetPoints
const cyan = 0x65e5ed
const amber = 0xffc474
const pink = 0xef82bd

function text(scene: Phaser.Scene, x: number, y: number, value: string, color = '#d7e6e5', size = 15) {
  return scene.add.text(x, y, value, {
    fontFamily: 'monospace',
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    stroke: '#07121c',
    strokeThickness: 4,
  }).setOrigin(0.5).setResolution(2)
}

function waypoint(scene: Phaser.Scene, x: number, y: number, title: string, color = amber) {
  let anchorY = y
  const ring = scene.add.ellipse(x, y, 76, 28).setStrokeStyle(2, color, 0.85).setDepth(y - 2)
  const light = scene.add.ellipse(x, y, 116, 46, color, 0.12).setDepth(y - 3)
  const pole = scene.add.rectangle(x, y - 77, 2, 52, color, 0.32).setDepth(y + 2)
  const badge = scene.add.container(x, y - 112).setDepth(y + 3)
  const hex = scene.add.graphics()
  hex.fillStyle(0x081923, 0.95).fillRoundedRect(-54, -19, 108, 38, 6)
  hex.lineStyle(2, color, 0.9).strokeRoundedRect(-54, -19, 108, 38, 6)
  badge.add([hex, text(scene, 0, 0, title, '#ecf7f1', 16)])
  const setVisible = (visible: boolean) => {
    for (const element of [ring, light, pole, badge]) element.setVisible(visible)
  }
  return {
    setVisible,
    setPosition(nextX: number, nextY: number) {
      anchorY = nextY
      ring.setPosition(nextX, nextY)
      light.setPosition(nextX, nextY)
      pole.setPosition(nextX, nextY - 77)
      badge.setPosition(nextX, nextY - 112)
      for (const element of [ring, light, pole, badge]) element.setDepth(nextY + 3)
    },
    animate(t: number, reduced: boolean) {
      ring.setScale(reduced ? 1 : 1 + Math.sin(t * 2.5) * 0.08)
      ring.setAlpha(reduced ? 0.8 : 0.65 + Math.sin(t * 2.5) * 0.2)
      light.setAlpha(reduced ? 0.11 : 0.09 + Math.sin(t * 2.5) * 0.04)
      badge.y = anchorY - 112 + (reduced ? 0 : Math.sin(t * 2.5) * 4)
    },
  }
}

function practical(scene: Phaser.Scene, x: number, y: number, width: number, color: number, phase: number) {
  const halo = scene.add.ellipse(x, y + 28, width * 1.5, 92, color, 0.12).setDepth(11)
  return (t: number, reduced: boolean) => {
    const level = reduced ? 0.85 : 0.84 + Math.sin(t * 0.9 + phase) * 0.11
    halo.setAlpha(level * 0.13)
  }
}

function fan(scene: Phaser.Scene, x: number, y: number, radius: number, depth: number) {
  const blades = scene.add.container(x, y).setDepth(depth)
  const g = scene.add.graphics()
  g.lineStyle(3, 0x8ea9b3, 0.65).strokeCircle(0, 0, radius)
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2
    g.fillStyle(0x6caeb9, 0.55).fillTriangle(0, 0, Math.cos(a) * radius * 0.85, Math.sin(a) * radius * 0.85, Math.cos(a + 0.7) * radius * 0.55, Math.sin(a + 0.7) * radius * 0.55)
  }
  blades.add(g)
  return (t: number, reduced: boolean) => blades.setAngle(reduced ? 0 : t * 70)
}

function streetTarget(s: ChapterSnapshot): Target {
  if (!s.spoken) return 'arun'
  if (!s.clues.includes('receipt')) return 'receipt'
  if (!s.clues.includes('relay')) return 'relay'
  if (!s.entered) return 'terminal'
  if (s.completed.length < 7) return 'terminal'
  if (!s.imageRecovered) return 'terminal'
  return 'exit'
}

/** One grounded plate owns the visible floor, walls and fixed furniture. Dynamic
 * characters, targets and practical lights are placed at the matching anchors. */
export function drawChapterStreet(scene: Phaser.Scene): Drawing {
  let elapsed = 0
  scene.add.image(0, 0, 'chapter-street').setOrigin(0).setDisplaySize(streetSize.width, streetSize.height).setDepth(-100)
  const windowReflections = [
    [255, 536], [558, 816], [839, 1023], [1043, 1359],
  ].map(([left, right]) => scene.add.tileSprite((left + right) / 2, 177, right - left, 119, 'chapter-skyline-reflection')
    .setTileScale(1.1).setAlpha(0.11).setDepth(0))

  // Distinct practical lights brighten the pictured lamps, never create new floating props.
  const lamps = [
    practical(scene, 73, 112, 142, pink, 0.4),
    practical(scene, 562, 26, 245, cyan, 1.5),
    practical(scene, 915, 26, 194, cyan, 0.2),
    practical(scene, 1390, 29, 132, amber, 2.1),
  ]
  const spinFan = fan(scene, 1545, 49, 26, 9)
  // Traffic and signage move behind the shop's panoramic glass; the floor remains still.
  const traffic = Array.from({ length: 5 }, (_, i) => {
    const point = scene.add.rectangle(0, 0, 26 + i * 8, 2, i % 2 ? pink : cyan, 0.45).setDepth(1)
    return point
  })
  const passingTrain = scene.add.container(0, 229).setDepth(2)
  const trainBody = scene.add.rectangle(0, 0, 132, 11, 0x132939, 0.88).setStrokeStyle(1, 0x64baca, 0.6)
  const trainWindows = Array.from({ length: 6 }, (_, i) => scene.add.rectangle(-48 + i * 18, -1, 10, 3, i % 2 ? amber : cyan, 0.76))
  passingTrain.add([trainBody, ...trainWindows])
  const workshopLight = scene.add.ellipse(520, 396, 490, 125, amber, 0.045).setDepth(5)
  const arunShadow = scene.add.ellipse(streetPoints.arun.x, streetPoints.arun.y - 3, 45, 12, 0x020911, 0.63).setDepth(streetPoints.arun.y - 2)
  const arun = scene.add.image(streetPoints.arun.x, streetPoints.arun.y, 'chapter-arun')
    .setOrigin(0.5, 1).setDisplaySize(73, 107).setDepth(streetPoints.arun.y + 1)

  // The receipt is on the intake counter's near edge. The relay sits flush on the right work bay.
  scene.add.rectangle(377, 583, 24, 32, 0xdbcaa6).setAngle(-11).setDepth(582)
  scene.add.rectangle(379, 579, 15, 2, 0x625b4c).setAngle(-11).setDepth(583)
  scene.add.ellipse(streetPoints.terminal.x, streetPoints.terminal.y, 43, 12, 0x020911, 0.6).setDepth(streetPoints.terminal.y - 1)
  const repairMachine = scene.add.image(streetPoints.terminal.x, streetPoints.terminal.y, 'chapter-machine')
    .setOrigin(0.5, 1).setDisplaySize(51, 65).setDepth(streetPoints.terminal.y + 1)

  const markers = {
    arun: waypoint(scene, streetPoints.arun.x, streetPoints.arun.y, 'อรุณ', amber),
    receipt: waypoint(scene, streetPoints.receipt.x, streetPoints.receipt.y, 'ร่องรอย 1', amber),
    relay: waypoint(scene, streetPoints.relay.x, streetPoints.relay.y, 'ร่องรอย 2', pink),
    terminal: waypoint(scene, streetPoints.terminal.x, streetPoints.terminal.y, 'เชื่อมต่อ', cyan),
    camera: waypoint(scene, streetPoints.camera.x, streetPoints.camera.y, 'CAM-07', amber),
    exit: waypoint(scene, streetPoints.exit.x, streetPoints.exit.y, 'กลับเมือง', cyan),
  }
  return {
    update(_time, delta, reduced, paused) {
      if (!paused && !reduced) elapsed += Math.min(delta, 60)
      const t = elapsed / 1000
      lamps.forEach((update) => update(t, reduced))
      spinFan(t, reduced)
      workshopLight.setAlpha(reduced ? 0.045 : 0.042 + Math.sin(t * 0.8) * 0.01)
      arun.setTint(reduced ? 0xffffff : (Math.sin(t * 0.8) > 0 ? 0xffffff : 0xf5f7f9))
      arunShadow.setAlpha(0.63)
      traffic.forEach((point, i) => {
        point.setPosition(reduced ? 350 + i * 160 : 245 + ((t * (32 + i * 10) + i * 191) % 1170), 154 + i * 12)
        point.setAlpha(reduced ? 0.15 : 0.22 + Math.sin(t * 1.3 + i) * 0.11)
      })
      windowReflections.forEach((layer, i) => { layer.tilePositionX = reduced ? 0 : t * (3 + i) })
      passingTrain.x = reduced ? 585 : 205 + ((t * 73) % 1230)
      passingTrain.setAlpha(reduced ? 0.18 : 0.48)
      repairMachine.setAlpha(reduced ? 1 : 0.92 + Math.sin(t * 2.1) * 0.04)
      const target = streetTarget(chapter.get())
      for (const [key, marker] of Object.entries(markers)) {
        marker.setVisible(key === target)
        marker.animate(t, reduced)
      }
    },
  }
}

