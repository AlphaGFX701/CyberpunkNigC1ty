// Browser-test-only entry. Vite serves this only when the test replaces the HTML entry script.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RepairWorkbench } from '../../src/chapter/RepairWorkbench'
import { relay } from '../../src/relay/model'
import { store } from '../../src/model'
import { cityProgress } from '../../src/city/progression'
import '../../src/style.css'
import '../../src/ui/pixel.css'
import '../../src/entry/entry.css'

const root = createRoot(document.getElementById('root')!)
let revision = 0
relay.activateOwner('relay-editor-test', 0)
relay.reset()
relay.talkToOfficer()
relay.collectClue('workorder')
relay.collectClue('module')
relay.startHack()
cityProgress.recordCamRecovery()
const open = (index: number) => {
  store.set({ taskIndex: index, overlay: index === 7 ? 'recovery' : 'terminal' })
  root.render(
    <RepairWorkbench
      key={++revision}
      chapterId="relay"
      final={index === 7}
      onClose={() => {
        store.set({ overlay: null })
        root.render(null)
      }}
    />
  )
}
Object.assign(window, { relayEditorHarness: { open, state: relay.get } })
open(0)
