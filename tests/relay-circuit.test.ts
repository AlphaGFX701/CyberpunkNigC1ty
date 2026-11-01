import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, Box3, Vector3 } from 'three'
import { buildRelayModel, RELAY_STAGES } from '../src/circuit/relay-geometry.ts'
import { CIRCUIT_STAGES } from '../src/circuit/model-geometry.ts'

test('RELAY-02 keeps the learned 7+1 route but uses station landmarks', () => {
  assert.equal(RELAY_STAGES.length, 8)
  assert.deepEqual(
    RELAY_STAGES.map(({ x, z }) => [x, z]),
    CIRCUIT_STAGES.map(({ x, z }) => [x, z])
  )
  assert.equal(RELAY_STAGES[7].kind, 'core')
  assert.equal(
    RELAY_STAGES.some((stage) => /CAM-07|camera/.test(stage.title + stage.kind)),
    false
  )
  const model = buildRelayModel([], 0)
  const districts = model.root.children.filter((item) => typeof item.userData.stage === 'number')
  assert.deepEqual(
    districts.map((item) => item.userData.stage),
    [0, 1, 2, 3, 4, 5, 6, 7]
  )
  assert.ok(model.fans.length >= 3)
  const size = new Box3().setFromObject(model.root).getSize(new Vector3())
  assert.ok(size.x <= 113 && size.z <= 85 && size.y <= 30)
  model.root.traverse((item) => {
    if (item instanceof Mesh) {
      const position = item.geometry.getAttribute('position')
      assert.ok([...position.array].every(Number.isFinite), `${item.name} has non-finite geometry`)
      item.geometry.dispose()
      for (const m of Array.isArray(item.material) ? item.material : [item.material]) m.dispose()
    }
  })
})

test('recovery returns light to the original-record tower without a camera mesh', () => {
  const model = buildRelayModel([0, 1, 2, 3, 4, 5, 6], 7)
  const core = model.root.children.find((item) => item.userData.stage === 7)
  assert.ok(core)
  assert.match(core.name, /original/)
  assert.ok(model.effects.length > 20)
  assert.equal(model.root.getObjectByName('TECHCARE_CIRCUIT_CITY'), undefined)
})
