import { useState } from 'react'
import { PixelButton } from '../ui/PixelUI'
import { relay } from './model'
import { puzzles, type PuzzleAnswer } from './puzzles'
import './relay-puzzle.css'

const routes = [
  { id: 'station', label: 'แฟ้มสถานี', detail: 'ข้อมูลสถานีและช่องสัญญาณ' },
  { id: 'arrival', label: 'บันทึกรับอุปกรณ์', detail: 'รายการรับของหลังเหตุโจรกรรม' },
]
const documents = ['station.html', 'logs/arrival.html']
const inventory = [
  { id: 'blackbox', label: 'BLACKBOX-17', type: 'COMMAND KEY', relevant: true },
  { id: 'mug', label: 'แก้วกาแฟ', type: 'DESK ITEM', relevant: false },
  { id: 'relay', label: 'RELAY-02', type: 'SIGNAL RECORDER', relevant: true },
  { id: 'lamp', label: 'โคมโต๊ะเวร', type: 'DESK ITEM', relevant: false },
]
const events = [
  { id: 'forward', label: '03:21 ส่งต่อ', detail: 'ข้อมูลถูกส่งออกจากสถานี' },
  { id: 'arrival', label: '03:16 รับอุปกรณ์', detail: 'มีผู้ส่งอุปกรณ์ให้เจ้าหน้าที่' },
  { id: 'connect', label: '03:18 เชื่อมต่อ', detail: 'อุปกรณ์ต่อเข้าช่องบันทึก' },
]
const zones = [
  { id: 'header', label: '<header>', note: 'ส่วนแนะนำรายงาน' },
  { id: 'main', label: '<main>', note: 'เนื้อหาหลักของหน้า' },
  { id: 'footer', label: '<footer>', note: 'ข้อมูลท้ายรายงาน' },
]
const pieces = [
  { id: 'identity', label: 'บันทึก RELAY-02' },
  { id: 'events', label: 'รายการส่งต่อ 03:21' },
  { id: 'source', label: 'แหล่งข้อมูล: RELAY-02' },
]
const records = [
  { id: 'connect', label: '03:18 เชื่อมต่อ BLACKBOX-17' },
  { id: 'omitted', label: 'รายการนี้ไม่อยู่ในรายงานผู้ว่าจ้าง' },
  { id: 'forward', label: '03:21 ส่งต่อออกจากสถานี' },
  { id: 'unit', label: 'ใบงานมีหมายเลขหน่วยเก่าของคิน' },
]
const clone = (answer: PuzzleAnswer): Record<string, string | string[]> =>
  Object.fromEntries(
    Object.entries(answer).map(([k, v]) => [k, typeof v === 'string' ? v : [...v]])
  )

/** Seven deliberately different interactions share only validation and the code hand-off. */
export function RelayPuzzle({ index, onSolved }: { index: number; onSolved: () => void }) {
  const puzzle = puzzles[index]
  const [answer, setAnswer] = useState<Record<string, string | string[]>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [folder, setFolder] = useState('')
  const [feedback, setFeedback] = useState(
    'เลือกคำตอบให้ครบ แล้วกดตรวจ Puzzle ไม่จับเวลาและไม่เสียคะแนน'
  )
  const array = (key: string) => (Array.isArray(answer[key]) ? (answer[key] as string[]) : [])
  const assign = (key: string, value: string) =>
    setAnswer((previous) => ({ ...previous, [key]: value }))
  const toggle = (key: string, value: string) =>
    setAnswer((previous) => {
      const current = Array.isArray(previous[key]) ? (previous[key] as string[]) : []
      return {
        ...previous,
        [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      }
    })
  const assignZone = (zone: string, piece: string) =>
    setAnswer((previous) => {
      const next = { ...previous }
      for (const key of Object.keys(next)) if (next[key] === piece) delete next[key]
      next[zone] = piece
      return next
    })
  const classify = (item: string, group: 'transmissions' | 'notes') =>
    setAnswer((previous) => {
      const transmissions = (
        Array.isArray(previous.transmissions) ? (previous.transmissions as string[]) : []
      ).filter((v) => v !== item)
      const notes = (Array.isArray(previous.notes) ? (previous.notes as string[]) : []).filter(
        (v) => v !== item
      )
      return {
        transmissions: group === 'transmissions' ? [...transmissions, item] : transmissions,
        notes: group === 'notes' ? [...notes, item] : notes,
      }
    })
  return (
    <section
      className="relay-puzzle repair-puzzle"
      data-puzzle-kind={puzzle.kind}
      aria-label={`Puzzle ${index + 1}: ${puzzle.title}`}
    >
      <div className="relay-puzzle-title">
        <span>RELAY-02 / LOGIC LINK {String(index + 1).padStart(2, '0')}</span>
        <h3>{puzzle.title}</h3>
        <p>{puzzle.instruction}</p>
      </div>
      {puzzle.kind === 'connections' && (
        <div className="relay-connections">
          <div>
            {routes.map((route) => (
              <button
                key={route.id}
                type="button"
                className="relay-cable-source"
                aria-label={`ต้นทาง ${route.label}`}
                aria-pressed={selected === route.id}
                onClick={() => setSelected(route.id)}
              >
                <b>{route.label}</b>
                <small>{route.detail}</small>
                <code>{answer[route.id] ?? 'เลือกปลายทาง →'}</code>
              </button>
            ))}
          </div>
          <div className="relay-cable-bus" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div>
            {documents.map((doc) => (
              <button
                key={doc}
                type="button"
                aria-label={`ปลายทาง ${doc}`}
                disabled={!selected}
                onClick={() => {
                  if (selected) assign(selected, doc)
                  setSelected(null)
                }}
              >
                <span>▤</span>
                <code>{doc}</code>
              </button>
            ))}
          </div>
        </div>
      )}
      {puzzle.kind === 'path' && (
        <div className="relay-file-browser">
          <nav aria-label="เส้นทางโฟลเดอร์">
            <button type="button" onClick={() => setFolder('')}>
              ROOT /
            </button>
            {folder && <span>logs /</span>}
          </nav>
          <div className="relay-file-grid">
            {!folder ? (
              <>
                <button
                  type="button"
                  aria-label="เปิดโฟลเดอร์ logs"
                  onClick={() => {
                    setFolder('logs')
                    setAnswer({ path: ['logs'] })
                  }}
                >
                  <span>▰</span>
                  <b>logs</b>
                  <small>โฟลเดอร์บันทึก</small>
                </button>
                <button
                  type="button"
                  aria-label="เลือกแฟ้ม arrival.html ที่หน้าหลัก"
                  onClick={() => setAnswer({ path: ['arrival.html'] })}
                >
                  <span>▤</span>
                  <b>arrival.html</b>
                  <small>แฟ้มเก่าที่หน้าหลัก</small>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="เลือกแฟ้ม logs/arrival.html"
                  onClick={() => setAnswer({ path: ['logs', 'arrival.html'] })}
                >
                  <span>▤</span>
                  <b>arrival.html</b>
                  <small>บันทึกรับอุปกรณ์</small>
                </button>
                <button
                  type="button"
                  aria-label="เลือกแฟ้ม logs/original.html"
                  onClick={() => setAnswer({ path: ['logs', 'original.html'] })}
                >
                  <span>▤</span>
                  <b>original.html</b>
                  <small>บันทึกต้นฉบับ — ภารกิจถัดไป</small>
                </button>
              </>
            )}
          </div>
          <output>
            เส้นทางที่เลือก: <code>{array('path').join('/') || 'ยังไม่เลือกแฟ้ม'}</code>
          </output>
        </div>
      )}
      {puzzle.kind === 'target' && (
        <div className="relay-bookmark-doc">
          <div className="relay-bookmark-link">
            <code>&lt;a href="#after-theft"&gt;</code>
            <b>หลังเหตุโจรกรรม ↓</b>
          </div>
          {[
            { id: 'before-theft', title: 'ก่อนเหตุโจรกรรม', detail: 'ระบบยังไม่รับอุปกรณ์' },
            { id: 'after-theft', title: 'หลังเหตุโจรกรรม', detail: 'ช่องรับอุปกรณ์หลัง 03:12' },
            { id: 'summary', title: 'สรุปเวร', detail: 'ข้อมูลทั่วไปของเจ้าหน้าที่' },
          ].map((target) => (
            <button
              type="button"
              key={target.id}
              aria-label={`เป้าหมาย ${target.id}`}
              aria-pressed={answer.target === target.id}
              onClick={() => assign('target', target.id)}
            >
              <code>id="{target.id}"</code>
              <b>{target.title}</b>
              <small>{target.detail}</small>
            </button>
          ))}
        </div>
      )}
      {puzzle.kind === 'inventory' && (
        <div className="relay-inventory">
          <div className="relay-inventory-log">
            <small>บันทึกการเชื่อมต่อ</small>
            <p>อุปกรณ์ BLACKBOX-17 ติดต่อผ่าน RELAY-02</p>
          </div>
          <div className="relay-file-grid">
            {inventory.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-label={`เลือกอุปกรณ์ ${item.label}`}
                aria-pressed={array('items').includes(item.id)}
                onClick={() => toggle('items', item.id)}
              >
                <span className={`relay-item-silhouette ${item.id}`} aria-hidden="true">
                  {item.id === 'blackbox'
                    ? '▣'
                    : item.id === 'relay'
                      ? '▥'
                      : item.id === 'mug'
                        ? '▱'
                        : '⊥'}
                </span>
                <b>{item.label}</b>
                <small>{item.type}</small>
                <em>{array('items').includes(item.id) ? 'เลือกแล้ว ✓' : 'เลือกอุปกรณ์'}</em>
              </button>
            ))}
          </div>
        </div>
      )}
      {puzzle.kind === 'timeline' && (
        <div className="relay-timeline">
          <div className="relay-event-pool">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                aria-label={event.label}
                disabled={array('order').includes(event.id)}
                onClick={() => toggle('order', event.id)}
              >
                <b>{event.label}</b>
                <small>{event.detail}</small>
              </button>
            ))}
          </div>
          <ol aria-label="ลำดับที่เลือก">
            {array('order').map((id, i) => (
              <li key={id}>
                <span>{i + 1}</span>
                <button type="button" onClick={() => toggle('order', id)}>
                  {events.find((e) => e.id === id)?.label}
                  <small>กดเพื่อนำออก</small>
                </button>
              </li>
            ))}
            {array('order').length === 0 && (
              <li className="relay-timeline-empty">เลือกเหตุการณ์จากข้อมูลด้านบนทีละรายการ</li>
            )}
          </ol>
        </div>
      )}
      {puzzle.kind === 'zones' && (
        <div className="relay-document-zones">
          <div className="relay-document-pieces">
            {pieces.map((piece) => (
              <button
                type="button"
                key={piece.id}
                aria-pressed={selected === piece.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', piece.id)}
                onClick={() => setSelected(piece.id)}
              >
                {piece.label}
              </button>
            ))}
          </div>
          <article aria-label="โครงหน้ารายงาน">
            {zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                aria-label={`ส่วน ${zone.id}`}
                className={`relay-zone ${zone.id}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const id = event.dataTransfer.getData('text/plain')
                  if (pieces.some((p) => p.id === id)) assignZone(zone.id, id)
                }}
                onClick={() => {
                  if (selected) assignZone(zone.id, selected)
                  setSelected(null)
                }}
              >
                <code>{zone.label}</code>
                <small>{zone.note}</small>
                <b>
                  {pieces.find((p) => p.id === answer[zone.id])?.label ??
                    'เลือกข้อมูล แล้ววางตรงนี้'}
                </b>
              </button>
            ))}
          </article>
        </div>
      )}
      {puzzle.kind === 'groups' && (
        <div className="relay-classifier">
          {records.map((record) => (
            <article key={record.id}>
              <p>{record.label}</p>
              <div>
                <button
                  type="button"
                  aria-pressed={array('transmissions').includes(record.id)}
                  onClick={() => classify(record.id, 'transmissions')}
                >
                  รายการส่งข้อมูล
                </button>
                <button
                  type="button"
                  aria-pressed={array('notes').includes(record.id)}
                  onClick={() => classify(record.id, 'notes')}
                >
                  หมายเหตุ
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="puzzle-feedback" role="status">
        {feedback}
      </p>
      <div className="repair-actions">
        <PixelButton
          variant="primary"
          onClick={() => {
            const result = relay.submitPuzzle(index, answer)
            setFeedback(result.feedback)
            if (result.ok) onSolved()
          }}
        >
          ตรวจ Puzzle → เขียน HTML
        </PixelButton>
        <PixelButton
          variant="solution"
          onClick={() => {
            relay.reveal(index)
            setAnswer(clone(puzzle.solution))
            if (puzzle.kind === 'path') setFolder('logs')
            setFeedback('แสดงการจัดคำตอบแล้ว อ่านเหตุผลจากโจทย์ก่อนกดตรวจ Puzzle')
          }}
        >
          เฉลย Puzzle
        </PixelButton>
      </div>
    </section>
  )
}
