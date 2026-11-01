import Phaser from 'phaser'
import { relay } from './model'
import { relayPoints, relaySize } from './layout'

export const relayTextureManifest = {
  'relay-station': '/assets/relay/scenes/station.webp',
  'relay-city': '/assets/relay/scenes/city.webp',
  'relay-server-front': '/assets/relay/scenes/server-front.webp',
  'relay-foreground': '/assets/relay/scenes/foreground.webp',
  'relay-officer': '/assets/relay/characters/officer-standing.webp',
  'relay-dish': '/assets/relay/scenes/dish.webp',
}
function marker(scene: Phaser.Scene, x: number, y: number, label: string) {
  const ring = scene.add
    .ellipse(x, y, 66, 22)
    .setStrokeStyle(2, 0x67e4ed, 0.8)
    .setDepth(y - 1)
  const badge = scene.add.container(x, y - 110).setDepth(y + 3)
  badge.add(scene.add.rectangle(0, 0, 116, 30, 0x081b27, 0.95).setStrokeStyle(1, 0x67e4ed, 0.85))
  badge.add(
    scene.add
      .text(0, 0, label, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '15px',
        color: '#e4f7f4',
      })
      .setOrigin(0.5)
      .setResolution(2)
  )
  return {
    update(visible: boolean, t: number, reduced: boolean) {
      ring.setVisible(visible)
      badge.setVisible(visible)
      badge.y = y - 110 + (reduced ? 0 : Math.sin(t * 2) * 3)
      ring.setAlpha(reduced ? 0.8 : 0.65 + Math.sin(t * 2) * 0.15)
    },
  }
}
/** All runtime layers share the 1600x900 source plate; feet own sorting depth. */
export function drawRelayStreet(scene: Phaser.Scene) {
  let elapsed = 0,
    gate = 0
  scene.add
    .image(0, 0, 'relay-station')
    .setOrigin(0)
    .setDisplaySize(relaySize.width, relaySize.height)
    .setDepth(-100)
  scene.add.image(518, 470, 'relay-server-front').setOrigin(0).setDepth(647)
  scene.add.image(1200, 735, 'relay-foreground').setOrigin(0).setDepth(902)
  scene.add
    .ellipse(relayPoints.officer.x, relayPoints.officer.y - 1, 39, 11, 0x020910, 0.6)
    .setDepth(relayPoints.officer.y - 1)
  const officer = scene.add
    .image(relayPoints.officer.x, relayPoints.officer.y, 'relay-officer')
    .setOrigin(0.5, 1)
    .setDisplaySize(63, 106)
    .setDepth(relayPoints.officer.y + 2)
  const cityTraffic = Array.from({ length: 5 }, (_, i) =>
    scene.add
      .rectangle(0, 90 + i * 26, 27 + i * 3, 2, i % 2 ? 0xe483c4 : 0x73e1f1, 0.5)
      .setDepth(-5)
  )
  const lamps = [
    [160, 245, 0xffba65],
    [485, 18, 0x62e3ed],
    [940, 18, 0x62e3ed],
    [1520, 280, 0xffb55d],
  ].map(([x, y, color]) => scene.add.ellipse(x, y + 20, 170, 85, color, 0.1).setDepth(1))
  const recoveryLights = Array.from({ length: 7 }, (_, i) =>
    scene.add.circle(670 + i * 45, 290, 3, 0xffbd64, 0.8).setDepth(2)
  )
  const waveform = scene.add.graphics().setDepth(3)
  const fan = scene.add.container(720, 408).setDepth(4).setScale(1, 0.36)
  const blades = scene.add.graphics().lineStyle(3, 0x91b9c5, 0.65)
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    blades.lineBetween(0, 0, Math.cos(a) * 32, Math.sin(a) * 32)
  }
  fan.add(blades)
  const dishArm = scene.add.graphics().setDepth(2)
  dishArm.lineStyle(8, 0x152b36, 1).lineBetween(1505, 350, 1320, 350)
  dishArm.lineStyle(3, 0x6b8790, 0.9).lineBetween(1505, 350, 1320, 350)
  dishArm.lineStyle(5, 0x304c58, 0.95).lineBetween(1505, 430, 1320, 350)
  const antenna = scene.add
    .image(1320, 350, 'relay-dish')
    .setOrigin(0.5, 1)
    .setDisplaySize(210, 195)
    .setDepth(3)
  const gatePanel = scene.add.container(1210, 547).setDepth(740)
  const grate = scene.add.graphics()
  grate.fillStyle(0x102734, 0.38).fillRect(-14, -188, 28, 375)
  grate.lineStyle(3, 0xa99050, 0.9).strokeRect(-14, -188, 28, 375)
  for (let y = -172; y < 180; y += 24) grate.lineBetween(-13, y, 13, y - 15)
  gatePanel.add(grate)
  const accessLamp = scene.add.circle(1209, 365, 5, 0xffb964).setDepth(741)
  const markers = Object.fromEntries(
    Object.entries(relayPoints).map(([k, p]) => [
      k,
      marker(
        scene,
        p.x,
        p.y,
        (
          {
            officer: 'เจ้าหน้าที่',
            workorder: 'ใบงาน',
            module: 'โมดูล',
            terminal: 'RELAY-02',
            evidence: 'ต้นฉบับ',
            exit: 'กลับเมือง',
          } as Record<string, string>
        )[k]
      ),
    ])
  )
  return {
    update(_time: number, delta: number, reduced: boolean, paused: boolean) {
      if (!paused && !reduced) elapsed += Math.min(delta, 60)
      const t = elapsed / 1000,
        s = relay.get()
      const wanted = s.spoken ? 1 : 0
      if (!paused)
        gate = reduced ? wanted : Phaser.Math.Linear(gate, wanted, Math.min(1, delta / 230))
      gatePanel.y = 547 - gate * 380
      gatePanel.setAlpha(1 - gate * 0.85)
      accessLamp.setFillStyle(s.spoken ? 0x65dfd9 : 0xffb964)
      lamps.forEach((l, i) =>
        l.setAlpha(reduced ? 0.09 : 0.09 + Math.sin(t * 0.8 + i * 1.3) * 0.018)
      )
      cityTraffic.forEach((v, i) =>
        v.setPosition(
          reduced ? 400 + i * 150 : 255 + ((t * (31 + i * 6) + i * 173) % 935),
          90 + i * 26
        )
      )
      blades.setRotation(reduced ? 0 : t * 4)
      antenna.setAngle(reduced ? 0 : Math.sin(t * 0.4) * 4)
      antenna.displayWidth = reduced ? 210 : 202 + Math.sin(t * 0.4) * 8
      officer.setTint(0xffffff)
      recoveryLights.forEach((l, i) =>
        l
          .setFillStyle(s.completed.includes(i) ? 0x65e4ed : 0xffbd64)
          .setAlpha(reduced ? 0.75 : 0.65 + Math.sin(t * 2 + i) * 0.2)
      )
      waveform.clear().lineStyle(2, 0x63e2ed, 0.7)
      for (let x = 0; x < 83; x += 3) {
        const y = (reduced ? Math.sin(x * 0.2) : Math.sin(x * 0.21 + t * 3)) * 7
        waveform.lineBetween(
          803 + x,
          250 + y,
          806 + x,
          250 + (reduced ? Math.sin((x + 3) * 0.2) : Math.sin((x + 3) * 0.21 + t * 3)) * 7
        )
      }
      const target = !s.spoken
        ? 'officer'
        : !s.clues.includes('workorder')
          ? 'workorder'
          : !s.clues.includes('module')
            ? 'module'
            : !s.finalRecovered
              ? 'terminal'
              : 'exit'
      Object.entries(markers).forEach(([k, m]) => m.update(k === target, t, reduced))
    },
  }
}
