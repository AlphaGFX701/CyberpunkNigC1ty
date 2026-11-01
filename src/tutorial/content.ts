import type { TutorialChoice, TutorialStepId } from './model.ts'
import { caseNarrative } from '../narrative/case.ts'

export type KinMood = 'neutral' | 'smile' | 'smirk' | 'serious' | 'surprised'
export type TutorialContext =
  'map' | 'journal' | 'pause' | 'settings' | 'street' | 'witness' | 'device' | 'terminal'
export type TutorialTarget =
  | 'rotate-left'
  | 'rotate-right'
  | 'city-drag'
  | 'zoom-in'
  | 'zoom-out'
  | 'reset-camera'
  | 'journal'
  | 'menu'
  | 'settings'
  | 'close-modal'
  | 'resume-game'
  | 'areas'
  | 'area-arun'
  | 'enter-arun'
  | 'world-move'
  | 'world-interact'
  | 'check-code'
  | 'return-map'
export type TutorialPrompt = Readonly<{
  text: string
  mood: KinMood
  mode: 'dialogue' | 'task'
  context: TutorialContext
  targets: readonly TutorialTarget[]
  choices?: readonly { id: TutorialChoice; label: string }[]
  nextLabel?: string
}>

const prompts: Record<TutorialStepId, TutorialPrompt> = {
  intro: {
    text: 'คิน หน่วยกู้ระบบ TechCare ฝากช่วยดูเทอร์มินัลหน่อย เดี๋ยวฉันลงพื้นที่เอง',
    mood: 'smile',
    mode: 'dialogue',
    context: 'map',
    targets: [],
    choices: [
      { id: 'chief', label: 'ได้เลย หัวหน้า' },
      { id: 'brief', label: 'ขอสรุปคดีก่อน' },
    ],
  },
  'intro-joke': {
    text: 'เรียกคินก็พอ งานยังไม่เริ่ม อย่าเพิ่งเพิ่มอายุให้ฉัน',
    mood: 'smirk',
    mode: 'dialogue',
    context: 'map',
    targets: [],
    nextLabel: 'แล้วคดีนี้เป็นยังไง?',
  },
  case: {
    text: `${caseNarrative.artifact.name} ของ${caseNarrative.artifact.owner}ถูกขโมย มันใช้ยืนยันคำสั่งของเครือข่ายฉุกเฉิน ถ้าคนร้ายปลอมคำสั่งได้ ทีมกู้ภัยอาจไปผิดที่ เราต้องตามคืนก่อนถึงขั้นนั้น`,
    mood: 'serious',
    mode: 'dialogue',
    context: 'map',
    targets: [],
    choices: [
      { id: 'ready', label: 'พร้อมแล้ว เริ่มตรงไหน?' },
      { id: 'more', label: 'ทำไมถึงจ้างคิน?' },
    ],
  },
  'case-more': {
    text: 'คนร้ายทิ้งหมายเลขหน่วยเก่าของฉันไว้ คู่หูฉันหายไปตั้งแต่ตอนนั้น ยังบอกไม่ได้ว่าเขาเกี่ยวข้องแค่ไหน ฉันเลยอยากเห็นหลักฐานต้นฉบับด้วยตัวเอง',
    mood: 'serious',
    mode: 'dialogue',
    context: 'map',
    targets: [],
    nextLabel: 'งั้นไปดูหลักฐานกัน',
  },
  'camera-intro': {
    text: 'นี่คือย่านฝั่งตะวันออก ฉันจะหมุนให้ดูสักมุมก่อน แล้วฝากช่วยสำรวจทางให้หน่อย',
    mood: 'neutral',
    mode: 'dialogue',
    context: 'map',
    targets: [],
    nextLabel: 'ดูเมืองอีกมุม',
  },
  'camera-demo': {
    text: 'กำลังหมุนมุมมอง…',
    mood: 'neutral',
    mode: 'task',
    context: 'map',
    targets: [],
  },
  'camera-fallback': {
    text: 'ภาพสามมิติเปิดไม่ได้ ใช้รายชื่อพื้นที่แทนได้ เลือกจุดหมายแล้วดูข้อมูลได้เหมือนกัน',
    mood: 'smile',
    mode: 'dialogue',
    context: 'map',
    targets: [],
    nextLabel: 'ใช้รายชื่อแทนก็ได้',
  },
  rotate: {
    text: 'ลองลากเมืองเพื่อหมุน หรือกดลูกศรหมุนด้านขวาได้เลย ถ้าเริ่มหลงมุม เดี๋ยวมีปุ่มพากลับ',
    mood: 'smile',
    mode: 'task',
    context: 'map',
    targets: ['city-drag', 'rotate-left', 'rotate-right'],
  },
  zoom: {
    text: 'ทีนี้ลองซูมดูอาคาร ใช้ล้อเมาส์หรือปุ่มบวกกับลบด้านขวาก็ได้',
    mood: 'neutral',
    mode: 'task',
    context: 'map',
    targets: ['zoom-in', 'zoom-out', 'city-drag'],
  },
  reset: {
    text: 'กดคืนมุมมองให้เห็นทั้งเมืองอีกครั้ง ปุ่มนี้ใช้ได้ทุกครั้งที่เผลอซูมไปมองหลังคาบ้านใครนานเกินไป',
    mood: 'smirk',
    mode: 'task',
    context: 'map',
    targets: ['reset-camera'],
  },
  'journal-open': {
    text: 'เปิดสมุดคดีด้านบนหน่อย ฉันเก็บเป้าหมายกับเบาะแสไว้ตรงนั้น จะได้ไม่ต้องจำทั้งหมดระหว่างเดิน',
    mood: 'neutral',
    mode: 'task',
    context: 'map',
    targets: ['journal'],
  },
  'journal-read': {
    text: `${caseNarrative.artifact.name} คือของที่ต้องตามคืน ส่วน ${caseNarrative.camera.id} ที่ร้านอรุณเป็นหลักฐานแรก ลองอ่านบันทึกแล้วปิดหน้าต่างกลับแมพได้เลย`,
    mood: 'serious',
    mode: 'task',
    context: 'journal',
    targets: ['close-modal'],
  },
  'menu-open': {
    text: 'ต่อไปเปิดเมนู หรือกด Escape ก็ได้ ฉันจะหยุดรอระหว่างที่เปิดอยู่ ไม่เดินไปไหนลับหลังแน่นอน',
    mood: 'smile',
    mode: 'task',
    context: 'map',
    targets: ['menu'],
  },
  'menu-settings': {
    text: 'เลือกตั้งค่าได้เลย ตรงนี้ปรับเสียง ลดการเคลื่อนไหว และเปิดเต็มจอได้',
    mood: 'neutral',
    mode: 'task',
    context: 'pause',
    targets: ['settings'],
  },
  'settings-read': {
    text: 'เลือกค่าที่สบายตาและสบายหูได้ตามใจ ไม่ต้องเปลี่ยนเพื่อผ่านขั้นนี้ ถ้าเสียงตืดของฉันรบกวน ก็ปิดเฉพาะเสียงข้อความได้ ดูเสร็จแล้วปิดหน้าต่างนี้',
    mood: 'smile',
    mode: 'task',
    context: 'settings',
    targets: ['close-modal'],
  },
  'menu-return': {
    text: 'กลับมาที่เมนูแล้ว กดกลับสู่เกมอีกครั้ง เราจะไปหาพยานกัน',
    mood: 'neutral',
    mode: 'task',
    context: 'pause',
    targets: ['resume-game', 'close-modal'],
  },
  'list-open': {
    text: 'ป้าย “อยู่ที่นี่” บอกตำแหน่งฉัน จุดที่เปิดแล้วเลือกสำรวจได้ ส่วนพื้นที่สีเทาต้องหาเบาะแสเพิ่มก่อน ลองเปิดรายชื่อพื้นที่ทางซ้ายบน',
    mood: 'neutral',
    mode: 'task',
    context: 'map',
    targets: ['areas'],
  },
  'select-arun': {
    text: 'เลือกร้านช่างอรุณจากรายการ การเลือกตอนนี้เปิดข้อมูลให้ดู ยังไม่ได้ออกเดินทาง',
    mood: 'neutral',
    mode: 'task',
    context: 'map',
    targets: ['area-arun'],
  },
  travel: {
    text: `${caseNarrative.camera.id} อาจเหลือภาพคนขน ${caseNarrative.artifact.name} ผ่านร้าน กดเข้าสำรวจเมื่อพร้อม แล้วฉันจะลงพื้นที่ให้`,
    mood: 'serious',
    mode: 'task',
    context: 'map',
    targets: ['enter-arun'],
  },
  'street-walk': {
    text: 'ถึงร้านแล้ว ใช้ WASD หรือลูกศรพาฉันเดินได้ ลองขยับเข้าหาช่างอรุณที่อยู่ทางซ้ายหน่อย',
    mood: 'smile',
    mode: 'task',
    context: 'street',
    targets: ['world-move'],
  },
  'witness-open': {
    text: 'เข้าใกล้อรุณแล้วกด E หรือปุ่มโต้ตอบ ถ้ายังไกลอยู่ ฉันจะบอกให้ขยับเข้าไปอีกนิด',
    mood: 'neutral',
    mode: 'task',
    context: 'street',
    targets: ['world-move', 'world-interact'],
  },
  'witness-read': {
    text: 'อรุณเห็นคนถือกล่อง แต่ภาพช่วงนั้นถูกลบ อ่านคำให้การให้ครบ แล้วปิดกลับไปตรวจเครื่องบันทึกกัน',
    mood: 'serious',
    mode: 'task',
    context: 'witness',
    targets: ['close-modal'],
  },
  'camera-enter': {
    text: 'เครื่องบันทึกอยู่ทางขวา เดินเข้าใกล้แล้วกด E เราจะเปิดพื้นที่จำลองภายในกล้องเพื่อกู้หน้าหลักฐาน',
    mood: 'neutral',
    mode: 'task',
    context: 'street',
    targets: ['world-move', 'world-interact'],
  },
  'chip-open': {
    text: 'ตัวเล็กลงแล้ว เดินตามทางวงจรไปใกล้จุดกู้ระบบ 01 แล้วกด E หน้าต่างแก้โค้ดจะเปิดขึ้น',
    mood: 'surprised',
    mode: 'task',
    context: 'device',
    targets: ['world-move', 'world-interact'],
  },
  repair: {
    text: 'ใส่ suspect.png ใน src แล้วเขียน alt บอกลักษณะคนในภาพ ลองตรวจคำตอบได้เลย ถ้าติด ใช้คำใบ้หรือปุ่มเฉลยสีชมพูได้ ฉันรอได้',
    mood: 'neutral',
    mode: 'task',
    context: 'terminal',
    targets: ['check-code'],
  },
  'repair-read': {
    text: 'ภาพกลับมาแล้ว เบาะแสนี้เปิดเส้นทางไปสถานีสื่อสารให้เรา ปิดหน้าต่างโค้ดก่อน แล้วค่อยกลับแผนที่เมือง',
    mood: 'smile',
    mode: 'task',
    context: 'terminal',
    targets: ['close-modal'],
  },
  'return-map': {
    text: 'กดแผนที่เมืองด้านบน เราจะดูว่าหลักฐานที่เพิ่งกู้เปิดทางไปที่ไหน',
    mood: 'neutral',
    mode: 'task',
    context: 'device',
    targets: ['return-map'],
  },
  done: {
    text: 'สถานีสื่อสารเปิดแล้ว ลองเลือกดูข่าวกรองต่อได้เลย ตอนนี้เรามีทั้งภาพกับเส้นทาง ฉันลงพื้นที่ต่อ ฝากดูเทอร์มินัลด้วยนะ',
    mood: 'smile',
    mode: 'dialogue',
    context: 'map',
    targets: [],
    nextLabel: 'เริ่มสำรวจอิสระ',
  },
}

for (const prompt of Object.values(prompts)) {
  Object.freeze(prompt.targets)
  if (prompt.choices) {
    for (const choice of prompt.choices) Object.freeze(choice)
    Object.freeze(prompt.choices)
  }
  Object.freeze(prompt)
}
Object.freeze(prompts)

export function getTutorialPrompt(step: TutorialStepId): TutorialPrompt
export function getTutorialPrompt(step: TutorialStepId | null): TutorialPrompt | null
export function getTutorialPrompt(step: TutorialStepId | null): TutorialPrompt | null {
  return step ? prompts[step] : null
}
