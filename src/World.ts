import Phaser from 'phaser'
import { fieldScenes, fieldTextures } from './field/scenes'
import { KIN_FRAME, KIN_DIRECTIONS, KIN_FOOT_EDGE, type KinDirection } from './field/kin-frames'
import { streetSize } from './chapter/layout'
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
  private facing: KinDirection = 'down'
  private moving = false
  private restored = false
  private drawing?: ReturnType<typeof fieldScenes.arun.draw>
  private chapterId: 'arun' | 'relay' = 'arun'
  private baseScale = 0.85
  constructor() {
    super('World')
  }
  preload() {
    this.load.spritesheet('kin', '/assets/chapter-one/characters/kin-walk.png', {
      frameWidth: KIN_FRAME.width,
      frameHeight: KIN_FRAME.height,
    })
    for (const [key, url] of Object.entries(fieldTextures)) this.load.image(key, url)
    this.load.spritesheet('witness', assets.witness, { frameWidth: 32, frameHeight: 64 })
    this.load.atlas('pixel-ui', assets.uiAtlas, assets.uiFrames)
    for (const key of ['props', 'city', 'null'] as const) this.load.image(key, assets[key])
    this.load.on('loaderror', () => store.set({ error: 'โหลดภาพไม่สำเร็จ ลองโหลดฉากใหม่อีกครั้ง' }))
  }
  create() {
    const dirs = KIN_DIRECTIONS
    for (const name of ['kin', 'witness'])
      dirs.forEach((dir, i) =>
        this.anims.create({
          key: `${name}-${dir}`,
          frames: this.anims.generateFrameNumbers(name, {
            start: i * (name === 'kin' ? 4 : 3),
            end: i * (name === 'kin' ? 4 : 3) + (name === 'kin' ? 3 : 2),
          }),
          frameRate: name === 'kin' ? 9 : 7,
          repeat: -1,
        })
      )
    dirs.forEach((dir, i) => {
      const first = i * 4
      this.anims.create({
        key: `kin-idle-${dir}`,
        frames: [{ key: 'kin', frame: first }],
        frameRate: 1,
        repeat: -1,
      })
    })
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
      if (this.player?.active) this.idle()
    }
    gameEvents.on('blur', resetOnBlur)
    this.unsubscribe = store.subscribe(() => {
      const s = store.get()
      if (this.input.keyboard) {
        const blocked = Boolean(s.overlay || s.paused || s.view === 'map' || s.view === 'device')
        this.input.keyboard.enabled = !blocked
        if (blocked) {
          this.input.keyboard.resetKeys()
          if (this.player?.active) this.idle()
          // Global capture is separate from the Scene plugin's enabled state.
          // Release arrows/Space so DOM sliders, text fields and buttons work.
          this.input.keyboard.disableGlobalCapture()
        } else this.input.keyboard.enableGlobalCapture()
      }
      if (s.reduceMotion) {
        this.rain?.clear()
        this.cameras.main.resetFX()
      }
      if (
        (s.view !== this.current || s.activeChapter !== this.chapterId) &&
        s.view !== 'map' &&
        s.view !== 'device'
      )
        this.renderWorld(s.view)
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
    if (view === 'map' || view === 'device') return
    this.current = view
    this.chapterId = store.get().activeChapter
    this.restored = store.get().repaired
    this.tweens.killAll()
    this.cameras.main.stopFollow()
    this.children.removeAll(true)
    if (view === 'boss') this.ground()
    this.drawing = undefined
    if (view === 'street') this.drawing = fieldScenes[this.chapterId].draw(this)
    if (view === 'boss') this.drawBoss()
    const p = store.get().positions[view]
    this.shadow = this.add
      .ellipse(p.x, p.y, view === 'boss' ? 110 : 36, view === 'boss' ? 18 : 10, 0x030b13, 0.55)
      .setDepth(90)
    this.player = this.add
      .sprite(p.x, p.y, 'kin', 0)
      .setOrigin(0.5, 1)
      .setScale(view === 'boss' ? 1.8 : 0.85)
      .setDepth(100)
    this.baseScale = view === 'boss' ? 1.8 : 0.85
    const size = view === 'street' ? streetSize : { width: W, height: H }
    this.cameras.main.setBounds(0, 0, size.width, size.height)
    this.cameras.main.setZoom(view === 'boss' ? 1 : 0.8)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setDeadzone(170, 100)
    this.rain = this.add.graphics().setDepth(2500)
    this.moving = false
    this.facing = 'down'
    this.player.play('kin-idle-down')
    this.anchorFeet()
    this.cameras.main.fadeIn(store.get().reduceMotion ? 0 : 260, 10, 20, 27)
    store.set({ ready: true })
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
    // Blocking input is distinct from pausing the world: practical lights and
    // machinery remain alive behind a conversation's blur.
    this.drawing?.update(time, delta, s.reduceMotion, s.paused)
    if (s.overlay || s.paused || s.view === 'map' || s.view === 'device') {
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
        const next = movePoint(p, dx, dy, delta / 1000, solids[s.view])
        const vx = next.x - p.x,
          vy = next.y - p.y
        if (Math.hypot(vx, vy) > 0.001) {
          setPosition(next)
          this.walk(vx, vy)
        } else {
          this.face(dx, dy)
          this.idle()
        }
      } else this.idle()
    } else {
      this.input.keyboard?.resetKeys()
      this.idle()
    }
    const next = store.get().positions[s.view]
    this.player.setPosition(Math.round(next.x), Math.round(next.y)).setDepth(next.y + 5)
    this.shadow.setPosition(next.x, next.y - 2).setDepth(next.y - 1)
    this.player.setScale(this.baseScale)
    this.anchorFeet()
    this.rain.clear()
  }
  private face(dx: number, dy: number) {
    const horizontal: KinDirection = dx > 0 ? 'right' : 'left',
      vertical: KinDirection = dy > 0 ? 'down' : 'up'
    if (Math.abs(dx) > Math.abs(dy) + 0.001) this.facing = horizontal
    else if (Math.abs(dy) > Math.abs(dx) + 0.001) this.facing = vertical
    else if (this.facing !== horizontal && this.facing !== vertical) this.facing = vertical
  }
  private anchorFeet() {
    const frame = Number(this.player.frame.name)
    this.player.setOrigin(0.5, (KIN_FOOT_EDGE[frame] ?? 122) / KIN_FRAME.height)
  }
  private walk(dx: number, dy: number) {
    this.face(dx, dy)
    this.player.play(`kin-${this.facing}`, true)
    this.moving = true
  }
  private idle() {
    if (this.moving || this.player.anims.currentAnim?.key !== `kin-idle-${this.facing}`) {
      this.player.play(`kin-idle-${this.facing}`, true)
      this.moving = false
    }
    this.anchorFeet()
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
