import { test } from 'node:test'
import assert from 'node:assert/strict'
import { caseNarrative } from '../src/narrative/case.ts'

test('one case record connects the employer, stolen signing key and first field objective', () => {
  assert.equal(caseNarrative.artifact.owner, 'อาราซาก้า')
  assert.equal(caseNarrative.employer.name, caseNarrative.artifact.owner)
  assert.match(caseNarrative.artifact.purpose, /กุญแจยืนยันคำสั่ง.*ฉุกเฉิน/)
  assert.match(caseNarrative.artifact.activation, /3 แห่ง/)
  assert.match(caseNarrative.artifact.risk, /ทีมกู้ภัย/)
  assert.equal(caseNarrative.field.map.objective, caseNarrative.firstObjective)
  assert.equal(caseNarrative.firstObjective, 'ตรวจหลักฐานที่ร้านอรุณ เพื่อตามเส้นทาง BLACKBOX')
  assert.equal(caseNarrative.camera.role, 'หลักฐานจุดแรกบนเส้นทาง BLACKBOX')
  assert.match(caseNarrative.field.device.detail, /HTML/)
  assert.match(caseNarrative.field.device.detail, /ไม่ใช่เข้าควบคุมเครือข่ายจริง/)
})

test('the opening reveals only an alias at the final shot and never confirms the missing partner identity', () => {
  const shots = caseNarrative.opening
  assert.equal(shots.length, 5)
  assert.equal(new Set(shots.map((shot) => shot.id)).size, 5)
  assert.equal(caseNarrative.antagonist.identityConfirmed, false)
  assert.equal(caseNarrative.hero.missingPartner, true)
  assert.equal(caseNarrative.employer.withholdsInformation, true)
  for (const shot of shots.slice(0, -1)) {
    const publicText = [
      shot.title,
      shot.location,
      shot.description,
      ...shot.lines.flatMap((line) => [line.label, line.text]),
    ].join(' ')
    assert.doesNotMatch(publicText, /NULL/)
    assert.notEqual(shot.reveal, 'alias')
  }
  assert.equal(shots.at(-1)?.reveal, 'alias')
  assert.ok(shots.at(-1)?.lines.some((line) => line.actor === 'intruder' && line.label === 'NULL'))
  assert.ok(shots[2].lines.some((line) => line.actor === 'partner'))
  assert.ok(shots[3].lines.some((line) => line.actor === 'arun'))
})

test('shot choreography uses local art and valid cancellable effect cues', () => {
  for (const shot of caseNarrative.opening) {
    assert.match(shot.art, /^\/assets\//)
    assert.ok(shot.description.length > 0)
    assert.equal(
      new Set(shot.composition.layers.map((layer) => layer.id)).size,
      shot.composition.layers.length
    )
    for (const cue of shot.cues) {
      assert.ok(Number.isFinite(cue.atMs) && cue.atMs >= 0 && cue.atMs < 3000)
    }
  }
})
