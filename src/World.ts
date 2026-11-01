import Phaser from 'phaser'
import { assets } from './assets'
import { caseNarrative } from './narrative/case'
import { tutorialCanMove } from './tutorial/controls'
import {
  store,
  solids,
  movePoint,
  setPosition,
  interact,
  nodes,
  circuitPath,
  type View,
} from './model'

const W = 1280,
  H = 720
export class World extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite
  private shadow!: Phaser.GameObjects.Ellipse
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private unsubscribe = () => {}
  private current: View = 'map'
  private rain!: Phaser.GameObjects.Graphics
  private facing = 'down'
  private moving = false
  private restored = false
  constructor() {
    super('World')
  }
  preload() {
    this.load.spritesheet('kin', assets.kin, { frameWidth: 32, frameHeight: 64 })
    this.load.spritesheet('witness', assets.witness, { frameWidth: 32, frameHeight: 64 })
    this.load.atlas('pixel-ui', assets.uiAtlas, assets.uiFrames)
    for (const key of ['props', 'city', 'null'] as const) this.load.image(key, assets[key])
    this.load.on('loaderror', () => store.set({ error: 'โหลดภาพไม่สำเร็จ ลองโหลดฉากใหม่อีกครั้ง' }))
  }
  create() {
    const dirs = ['down', 'left', 'right', 'up']
    for (const name of ['kin', 'witness'])
      dirs.forEach((dir, i) =>
        this.anims.create({
          key: `${name}-${dir}`,
          frames: this.anims.generateFrameNumbers(name, { start: i * 3, end: i * 3 + 2 }),
          frameRate: 7,
          repeat: -1,
        })
      )
    this.crop('front-a', 'city', 48, 208, 48, 112)
    this.crop('front-b', 'city', 96, 208, 48, 112)
    this.crop('front-c', 'city', 144, 208, 48, 112)
    this.crop('front-d', 'city', 192, 208, 48, 112)
    this.crop('car', 'props', 0, 382, 160, 64)
    this.crop('shop', 'props', 256, 0, 64, 32)
    this.crop('aircon', 'props', 0, 78, 64, 48)
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >
    this.input.keyboard!.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE'])
    this.input.keyboard!.on('keydown-E', () => {
      const { overlay, paused } = store.get()
      if (!overlay && !paused) interact()
    })
    const gameEvents = this.game.events
    const resetOnBlur = () => {
      this.input.keyboard?.resetKeys()
    }
    gameEvents.on('blur', resetOnBlur)
    this.unsubscribe = store.subscribe(() => {
      const s = store.get()
      if (this.input.keyboard) {
        const blocked = Boolean(s.overlay || s.paused || s.view === 'map')
        this.input.keyboard.enabled = !blocked
        if (blocked) {
          this.input.keyboard.resetKeys()
          // Global capture is separate from the Scene plugin's enabled state.
          // Release arrows/Space so DOM sliders, text fields and buttons work.
          this.input.keyboard.disableGlobalCapture()
        } else this.input.keyboard.enableGlobalCapture()
      }
      if (s.reduceMotion) {
        this.rain?.clear()
        this.cameras.main.resetFX()
      }
      if (s.view !== this.current && s.view !== 'map') this.renderWorld(s.view)
      if (s.repaired !== this.restored && s.view === 'device') {
        this.renderWorld('device')
      }
    })
    // A whole Phaser game teardown emits Scene DESTROY without SHUTDOWN.
    // Both paths must release the external store and game-event subscriptions.
    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      this.unsubscribe()
      this.unsubscribe = () => {}
      gameEvents.off('blur', resetOnBlur)
      this.events.off('shutdown', cleanup)
      this.events.off('destroy', cleanup)
    }
    this.events.once('shutdown', cleanup)
    this.events.once('destroy', cleanup)
    this.renderWorld(store.get().view)
  }
  private crop(key: string, source: string, x: number, y: number, w: number, h: number) {
    const texture = this.textures.createCanvas(key, w, h)!
    texture.context.drawImage(
      this.textures.get(source).getSourceImage() as HTMLImageElement,
      x,
      y,
      w,
      h,
      0,
      0,
      w,
      h
    )
    texture.refresh()
  }
  private rect(x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    return this.add.rectangle(x, y, w, h, color, alpha).setOrigin(0)
  }
  private text(x: number, y: number, text: string, size = 13, color = '#adc4c6') {
    return this.add
      .text(x, y, text, { fontFamily: 'monospace', fontSize: size, color })
      .setResolution(2)
  }
  private line(points: number[][], color: number, width: number, alpha = 1) {
    const g = this.add.graphics()
    g.lineStyle(width, color, alpha)
    g.beginPath()
    points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    g.strokePath()
    return g
  }
  private building(x: number, y: number, w: number, h: number, style: number, label: string) {
    this.rect(x + 12, y + 14, w, h, 0x071116, 0.8)
    this.rect(x, y, w, h, 0x263940)
    this.rect(x + 5, y + 5, w - 10, Math.max(20, h * 0.28), 0x3b4b4d)
    const g = this.add.graphics()
    g.lineStyle(2, 0x52605b, 0.6)
    g.strokeRect(x + 9, y + 9, w - 18, Math.max(16, h * 0.28 - 8))
    for (let i = 0; i < 3; i++) {
      this.rect(x + 14 + i * 24, y + 14, 15, 9, 0x1a2e35)
      this.rect(x + 15 + i * 24, y + 15, 12, 2, 0x677365)
    }
    const front = this.add
      .image(x, y + h * 0.3, `front-${['a', 'b', 'c', 'd'][style % 4]}`)
      .setOrigin(0)
      .setDisplaySize(w, h * 0.7)
    front.setAlpha(0.9)
    this.rect(x - 3, y + h * 0.29, w + 6, 5, 0x5a716e)
    if (label) {
      this.rect(x + 8, y + h * 0.36, w - 16, 24, 0x14272f, 0.94)
      this.text(x + 15, y + h * 0.36 + 4, label, 12, '#edc67d')
    }
  }
  private lamp(x: number, y: number) {
    this.rect(x - 2, y - 86, 4, 86, 0x70807a)
    this.rect(x - 3, y - 88, 30, 4, 0x607c7b)
    this.rect(x + 17, y - 84, 13, 5, 0xf1c477)
    this.add.ellipse(x + 20, y + 5, 110, 40, 0xf3c77b, 0.05)
    this.add.circle(x + 23, y - 80, 25, 0xf3c77b, 0.06)
  }
  private ground() {
    this.rect(0, 0, W, H, 0x16272e)
    const g = this.add.graphics()
    for (let y = 0; y < H; y += 32)
      for (let x = 0; x < W; x += 32) {
        const k = (x * 31 + y * 17) % 79
        g.fillStyle(k < 30 ? 0x26373a : 0x1e3035, 0.5)
        g.fillRect(x + 1, y + 1, 30, 30)
        if (k < 14) {
          g.lineStyle(1, 0x4e6060, 0.2)
          g.lineBetween(x + 4, y + 5, x + 22, y + 5)
        }
      }
  }
  private renderWorld(view: View) {
    if (view === 'map') return
    this.current = view
    this.restored = store.get().repaired
    this.children.removeAll(true)
    this.ground()
    if (view === 'street') this.drawStreet()
    if (view === 'device') this.drawDevice()
    if (view === 'boss') this.drawBoss()
    const p = store.get().positions[view]
    this.shadow = this.add
      .ellipse(p.x, p.y, view === 'boss' ? 110 : 36, view === 'boss' ? 18 : 10, 0x030b13, 0.55)
      .setDepth(90)
    this.player = this.add
      .sprite(p.x, p.y, 'kin', 0)
      .setOrigin(0.5, 1)
      .setScale(view === 'device' ? 0.65 : view === 'boss' ? 2.8 : 1.6)
      .setDepth(100)
    this.rain = this.add.graphics().setDepth(150)
    this.moving = false
    this.facing = 'down'
    this.cameras.main.fadeIn(store.get().reduceMotion ? 0 : 260, 10, 20, 27)
    store.set({ ready: true })
  }
  private drawStreet() {
    this.rect(0, 445, W, 245, 0x273b41)
    for (let x = 0; x < W; x += 64) {
      this.rect(x, 445, 62, 10, 0x73817b, 0.65)
      this.rect(x, 655, 62, 7, 0x778279, 0.55)
    }
    this.rect(0, 675, W, 45, 0x11252c)
    this.building(55, 95, 260, 330, 0, 'TECHCARE / SERVICE')
    this.building(365, 100, 245, 325, 2, 'ARUN / REPAIR')
    this.building(770, 72, 355, 353, 3, 'CAMERA / RECORDING')
    this.rect(630, 140, 94, 305, 0x0d222a)
    for (let y = 160; y < 420; y += 48) this.rect(638, y, 75, 2, 0x35545a)
    this.add.image(1050, 610, 'car').setScale(1.1)
    this.add.image(1140, 290, 'shop').setScale(1.5).setAlpha(0.8)
    this.add.image(95, 332, 'aircon').setScale(1.2)
    this.lamp(310, 570)
    this.lamp(750, 570)
    this.lamp(1195, 580)
    this.add.ellipse(570, 472, 34, 10, 0x000000, 0.4)
    this.add.sprite(575, 470, 'witness', 0).setOrigin(0.5, 1).setScale(1.5).setDepth(75)
    this.add.image(575, 357, 'pixel-ui', 'quest-new').setScale(2)
    this.rect(818, 425, 62, 44, 0x10232b)
    this.rect(824, 431, 49, 23, 0x507c79)
    this.rect(827, 434, 42, 4, 0xd1b77d)
    this.rect(834, 471, 34, 5, 0xb99d63)
    this.add.circle(850, 452, 48, 0xd8b270, 0.05)
    this.text(790, 496, caseNarrative.worldLabels.cameraOffline, 12, '#e4bf7c')
    this.line(
      [
        [825, 463],
        [825, 520],
        [760, 520],
      ],
      0x9b8b61,
      2,
      0.6
    )
    for (let i = 0; i < 10; i++) {
      this.rect(90 + i * 113, 585 + (i % 3) * 18, 42, 2, 0x6b959e, 0.2)
      this.rect(88 + i * 113, 589 + (i % 3) * 18, 27, 1, 0xd6ac68, 0.15)
    }
    this.text(52, 692, 'EAST BANK / SOI 07', 11, '#78959b')
  }
  private drawDevice() {
    this.rect(0, 0, W, H, 0x0d1f2a)
    const g = this.add.graphics()
    g.lineStyle(1, 0x274655, 0.34)
    for (let x = 0; x < W; x += 32) g.lineBetween(x, 0, x, H)
    for (let y = 0; y < H; y += 32) g.lineBetween(0, y, W, y)
    const path = circuitPath.map((n) => [n.x, n.y])
    this.line(path, 0x06151d, 80)
    this.line(path, 0x25454e, 66)
    this.line(path, 0x91c6bd, 2, 0.4)
    nodes.forEach((n, i) => {
      const repaired = i === 0 && store.get().repaired
      this.rect(n.x - 39, n.y - 45, 78, 64, 0x233c47)
      this.rect(n.x - 34, n.y - 40, 68, 53, 0x122b37)
      for (let k = 0; k < 6; k++) {
        this.rect(n.x - 45, n.y - 37 + k * 8, 6, 3, 0x9a9f7c)
        this.rect(n.x + 39, n.y - 37 + k * 8, 6, 3, 0x9a9f7c)
      }
      this.rect(n.x - 25, n.y - 31, 50, 34, repaired ? 0x2f7a6f : 0x563e4c)
      this.text(n.x - 18, n.y - 27, repaired ? 'OK' : n.tag, 19, repaired ? '#b8efd0' : '#eab28c')
      this.rect(n.x - 37, n.y + 24, 74, 3, repaired ? 0x9bd9b5 : 0xcba86d, 0.7)
      this.add.image(n.x + 29, n.y - 43, 'pixel-ui', repaired ? 'quest-complete' : 'quest-active')
    })
    // Board traces, solder pads, and memory banks establish the scale of the tiny avatar.
    for (let i = 0; i < 18; i++) {
      const x = 48 + ((i * 79) % 1190),
        y = 160 + ((i * 113) % 460)
      this.line(
        [
          [x, y],
          [x + 34, y],
          [x + 34, y + 35],
          [x + 70, y + 35],
        ],
        0x528b84,
        2,
        0.25
      )
      this.add.circle(x, y, 4, 0xb4ae7a, 0.3)
    }
    for (const [x, y] of [
      [80, 200],
      [440, 190],
      [770, 600],
      [1090, 620],
    ]) {
      this.rect(x, y, 100, 32, 0x263641)
      for (let i = 0; i < 8; i++) this.rect(x + i * 12, y - 3, 6, 5, 0x9e9e7e)
      this.text(x + 8, y + 10, 'MEM / CAM', 9, '#749b9c')
    }
    this.rect(40, 90, 270, 42, 0x142e39)
    this.text(56, 104, caseNarrative.worldLabels.cameraRecovery, 14, '#a0cec4')
    this.text(43, 675, 'LOCAL DEVICE SPACE  /  7 RECOVERY NODES', 11, '#668b99')
  }
  private drawBoss() {
    this.rect(0, 0, W, H, 0x111f2a)
    for (let i = 0; i < 9; i++) {
      const x = 65 + i * 145
      this.rect(x, 125, 100, 355, 0x1c3341)
      this.rect(x + 8, 135, 84, 335, 0x142935)
      for (let j = 0; j < 10; j++) {
        this.rect(x + 17, 152 + j * 29, 58, 8, 0x263e47)
        this.rect(x + 78, 152 + j * 29, 5, 5, j % 3 === 0 ? 0xb89466 : 0x609b9d)
      }
    }
    this.rect(0, 480, W, 240, 0x243741)
    const g = this.add.graphics()
    g.lineStyle(1, 0x507180, 0.35)
    for (let y = 492; y < 720; y += 38) g.lineBetween(0, y, W, y)
    for (let x = -300; x < 1600; x += 100) g.lineBetween(640 + (x - 640) * 0.5, 480, x, 720)
    this.rect(260, 575, 765, 8, 0x71887d, 0.6)
    this.rect(260, 590, 765, 3, 0x435e65)
    this.add.ellipse(940, 568, 160, 22, 0x000000, 0.4)
    this.add.image(940, 569, 'null').setOrigin(0.5, 1).setDisplaySize(210, 255)
    this.add.circle(940, 430, 145, 0xb45e83, 0.035)
    this.text(290, 618, 'KIN / CODE RECOVERY', 14, '#accec2')
    this.text(865, 618, 'WATCHER / MALWARE', 14, '#db9da9')
    this.line(
      [
        [510, 535],
        [565, 535],
        [580, 520],
        [650, 520],
      ],
      0xd0b27a,
      3,
      0.6
    )
    this.text(550, 402, 'VERIFY → RESTORE', 14, '#c5bc96')
  }
  update(time: number, delta: number) {
    if (!this.player || !this.keys) return
    const s = store.get(),
      p = s.positions[s.view]
    if (s.overlay || s.paused || s.view === 'map') {
      this.idle()
      this.rain.clear()
      return
    }
    if (s.view !== 'boss' && tutorialCanMove()) {
      const dx =
        Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
        Number(this.keys.A.isDown || this.keys.LEFT.isDown)
      const dy =
        Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
        Number(this.keys.W.isDown || this.keys.UP.isDown)
      if (dx || dy) {
        setPosition(movePoint(p, dx, dy, delta / 1000, solids[s.view], s.view === 'device'))
        this.walk(dx, dy)
      } else this.idle()
    } else this.idle()
    const next = store.get().positions[s.view]
    this.player.setPosition(Math.round(next.x), Math.round(next.y))
    this.shadow.setPosition(next.x, next.y - 2)
    this.rain.clear()
    if (!s.reduceMotion && s.view !== 'device' && s.view !== 'boss') {
      this.rain.lineStyle(1, 0xa9c4cd, 0.12)
      for (let i = 0; i < 55; i++) {
        const x = (i * 173 + time * 0.014) % W,
          y = (i * 89 + time * 0.27) % H
        this.rain.lineBetween(x, y, x - 3, y + 12)
      }
    }
  }
  private walk(dx: number, dy: number) {
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
    this.player.play(`kin-${this.facing}`, true)
    this.moving = true
  }
  private idle() {
    if (this.moving) {
      this.player.anims.stop()
      this.player.setFrame(['down', 'left', 'right', 'up'].indexOf(this.facing) * 3)
      this.moving = false
    }
  }
}

export function makeGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: W,
    height: H,
    backgroundColor: '#101d26',
    pixelArt: true,
    roundPixels: true,
    scene: World,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: false },
    audio: { noAudio: true },
  })
  // The entry controller retains this instance while hiding the game layer.
  // Refresh FIT sizing when the layer is shown again, without resizing its
  // fixed logical world or changing collision/input coordinates.
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      if (parent.clientWidth > 0 && parent.clientHeight > 0 && game.isBooted) game.scale.refresh()
    })
    observer.observe(parent)
    game.events.once('destroy', () => observer.disconnect())
  }
  return game
}
