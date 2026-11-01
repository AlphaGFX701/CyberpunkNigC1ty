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
  | 'circuit-list'
  | 'circuit-stage-0'
  | 'circuit-start'
  | 'puzzle-action'
  | 'editor-snippet'
  | 'editor-undo'
  | 'edit-code'
  | 'submit-code'
  | 'hint'
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
    text: 'เปิดสมุดคดีด้านบน หรือกด J ได้ ฉันเก็บเป้าหมายกับเบาะแสไว้ตรงนั้น จะได้ไม่ต้องจำทั้งหมดระหว่างเดิน',
    mood: 'neutral',
    mode: 'task',
    context: 'map',
    targets: ['journal'],
  },
  'journal-read': {
    text: `${caseNarrative.artifact.name} คือของที่ต้องตามคืน ส่วน ${caseNarrative.camera.id} ที่ร้านอรุณเป็นหลักฐานแรก อ่านเสร็จแล้วกด J อีกครั้ง หรือปิดหน้าต่างกลับแมพได้เลย`,
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
    text: 'ถึงร้านแล้ว ใช้ WASD หรือลูกศรพาฉันเดินได้ ลองเดินไปหาอรุณตรงป้าย ARUN / REPAIR อย่าเพิ่งหยิบของลุง เดี๋ยวได้ซ่อมใช้หนี้แทนสืบคดี',
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
    text: 'อ่านคำให้การของอรุณให้ครบก่อน ลุงโดนหลอกให้ต่ออุปกรณ์ เราต้องตรวจใบรับของกับตัวส่งสัญญาณให้รู้ว่าเขาทิ้งอะไรไว้',
    mood: 'serious',
    mode: 'task',
    context: 'witness',
    targets: ['close-modal'],
  },
  traces: {
    text: 'เก็บใบรับของที่เคาน์เตอร์ซ้าย แล้วอ้อมไปตรวจตัวส่งสัญญาณหลังแผงด้านขวา ดู Marker ได้ ไม่ต้องรื้อของทั้งร้าน เดี๋ยวลุงคิดค่าเก็บใหม่',
    mood: 'smirk',
    mode: 'task',
    context: 'street',
    targets: ['world-move', 'world-interact', 'hint'],
  },
  'field-map': {
    text: 'ได้ร่องรอยสองชิ้นแล้ว ลองกด M หรือแผนที่เมืองด้านบนเพื่อออกไปดูเส้นทาง เบาะแสกับงานที่ทำไว้ยังอยู่ ไม่ต้องเก็บใบรับของให้ลุงอีกรอบ',
    mood: 'smirk',
    mode: 'task',
    context: 'street',
    targets: ['return-map'],
  },
  'field-return': {
    text: 'ทีนี้เปิดรายชื่อพื้นที่ เลือกร้านอรุณ แล้วกดเข้าสำรวจเพื่อกลับร้านเดิม ฉันยังอยู่ตรงที่เราออกมา ของลุงก็ยังอยู่… เท่าที่ลุงนับทันนะ',
    mood: 'smile',
    mode: 'task',
    context: 'map',
    targets: ['areas', 'area-arun', 'enter-arun'],
  },
  'camera-enter': {
    text: 'กลับมาแล้ว ร่องรอยสองชิ้นยังอยู่ครบ ไปเครื่องซ่อมกลางร้าน กด E แล้วเริ่มเชื่อมต่อ เราจะซ่อมหน้าบันทึกก่อนเปิดภาพ CAM-07',
    mood: 'neutral',
    mode: 'task',
    context: 'street',
    targets: ['world-move', 'world-interact'],
  },
  'chip-open': {
    text: 'นี่คือ Circuit City เลือกเขต 01 “ประตู BODY” จากอาคารหรือรายชื่อด่าน แล้วกดเริ่มซ่อม ตรงนี้เลือกด่านได้เลย ไม่ต้องพาฉันเดินบนแผงวงจร',
    mood: 'smile',
    mode: 'task',
    context: 'device',
    targets: ['circuit-list', 'circuit-stage-0', 'circuit-start'],
  },
  puzzle: {
    text: 'เริ่มจาก Puzzle: เนื้อหาที่คนอ่านเห็นอยู่ใน body ส่วนข้อมูลของเอกสารอยู่ใน head เลือกการ์ดแล้วเลือกช่องปลายทาง จากนั้นกดต่อวงจร',
    mood: 'neutral',
    mode: 'task',
    context: 'terminal',
    targets: ['puzzle-action'],
  },
  snippet: {
    text: 'Puzzle ผ่านแล้ว ลองกดปุ่มแทรกแท็กใต้ช่องโค้ดสักปุ่ม มันแทรกตรงเคอร์เซอร์หรือแทนข้อความที่เลือกไว้ ไม่ได้เขียนทั้งหน้าให้เรา',
    mood: 'smile',
    mode: 'task',
    context: 'terminal',
    targets: ['edit-code', 'editor-snippet'],
  },
  undo: {
    text: 'ทีนี้กด Ctrl+Z หรือปุ่มเลิกทำ เพื่อย้อนการแทรกเมื่อกี้ ลองผิดได้ โค้ดยังไม่ได้ส่งไปไหน ไม่ต้องตกใจเหมือนลุงเห็นบิลอะไหล่',
    mood: 'smirk',
    mode: 'task',
    context: 'terminal',
    targets: ['edit-code', 'editor-undo'],
  },
  repair: {
    text: 'ใส่ <p>ร้านอรุณเปิดแล้ว</p> ไว้ข้างใน body ให้ครบ แล้วกดตรวจโครงสร้าง ปุ่มนี้บอกผลอย่างเดียว ยังไม่ให้คะแนน ใช้คำใบ้หรือเฉลยสีชมพูได้',
    mood: 'neutral',
    mode: 'task',
    context: 'terminal',
    targets: ['edit-code', 'check-code'],
  },
  'repair-submit': {
    text: 'โครงสร้างผ่านแล้ว แต่ยังไม่ได้บันทึกผล กดส่งคำสั่งซ่อม หรือคลิกกลับช่องโค้ดแล้วกด Ctrl+Enter คราวนี้ถึงจะคืนไฟเขตแรกและได้คะแนน',
    mood: 'neutral',
    mode: 'task',
    context: 'terminal',
    targets: ['edit-code', 'check-code', 'submit-code'],
  },
  'repair-read': {
    text: 'เขต BODY ซ่อมสำเร็จ ได้ 10 คะแนนแล้ว ปิดหน้าซ่อมก่อน ฉันจะสรุปวิธีเดินทางให้ ภาพ CAM-07 ยังต้องผ่านอีกหกเขตและหอกล้อง ไม่ได้กู้ด้วยโจทย์นี้ข้อเดียว',
    mood: 'smile',
    mode: 'task',
    context: 'terminal',
    targets: ['close-modal'],
  },
  'return-map': {
    text: 'กดแผนที่เมืองด้านบน หรือกด M เพื่อกลับไปดูเส้นทาง ความคืบหน้าที่ซ่อมไว้ยังอยู่ ใช้ M ตอนเดินหรือเลือกด่านได้ แต่ไม่แทรกระหว่างพิมพ์โค้ดหรือเปิดหน้าต่าง',
    mood: 'neutral',
    mode: 'task',
    context: 'device',
    targets: ['return-map'],
  },
  done: {
    text: 'ฝึกเขตแรกครบแล้ว กลับร้านอรุณและเข้าเครื่องต่อได้ อีกหกเขตจะเปิดหอกล้อง CAM-07 พอกู้ภาพสำเร็จจึงเปิดสถานีสื่อสาร ส่วน J เปิดสมุดคดี M กลับแผนที่ และ H เปิดคำใบ้ ฝากดูเทอร์มินัลด้วยนะ',
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
