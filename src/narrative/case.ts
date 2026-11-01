import type { EntryCue } from '../entry/audio'

export type SpeakerId = 'system' | 'arasaka' | 'kin' | 'partner' | 'arun' | 'intruder'
export type CinematicLayer = {
  id: string
  kind:
    | 'rain'
    | 'kin'
    | 'monitor'
    | 'beacon'
    | 'cable'
    | 'signal'
    | 'file'
    | 'door'
    | 'tamper'
    | 'network'
    | 'memory'
  placement?: {
    left?: string
    top?: string
    right?: string
    bottom?: string
    width?: string
    height?: string
  }
  delayMs?: number
}
export type StoryShot = {
  id: string
  title: string
  location: string
  art: string
  description: string
  connection: 'local' | 'secure' | 'archive' | 'intercept'
  reveal: 'anonymous' | 'familiar' | 'alias'
  composition: { name: string; layers: readonly CinematicLayer[] }
  cues: readonly { cue: EntryCue; atMs: number }[]
  lines: readonly { actor: SpeakerId; label: string; text: string }[]
}

const artifact = {
  name: 'BLACKBOX',
  owner: 'อาราซาก้า',
  purpose: 'กุญแจยืนยันคำสั่งของเครือข่ายสื่อสารฉุกเฉินระดับประเทศ',
  activation: 'ต้องเชื่อมผ่านสถานีสำคัญ 3 แห่งก่อนใช้งานเต็มรูปแบบ',
  risk: 'ผู้ถืออาจปลอมประกาศเตือนภัยและเปลี่ยนคำสั่งส่งทีมกู้ภัย',
} as const
const firstObjective = 'ตรวจหลักฐานที่ร้านอรุณ เพื่อตามเส้นทาง BLACKBOX'
const camera = {
  id: 'CAM-07',
  owner: 'ร้านช่างอรุณ',
  role: 'หลักฐานจุดแรกบนเส้นทาง BLACKBOX',
} as const

const opening: readonly StoryShot[] = [
  {
    id: 'theft',
    title: 'ของที่หายไป',
    location: 'ห้องนิรภัยอาราซาก้า · 03:12 น.',
    art: '/assets/blackbox/vault.webp',
    description:
      'ผู้บุกรุกปิดบังใบหน้าถอด BLACKBOX จากแท่นในห้องนิรภัยอาราซาก้า ก่อนประตูปิดตามหลัง',
    connection: 'local',
    reveal: 'anonymous',
    composition: {
      name: 'vault',
      layers: [
        { id: 'tamper', kind: 'tamper', placement: { left: '67%', top: '44%' }, delayMs: 500 },
        {
          id: 'vault-door',
          kind: 'door',
          placement: { right: '0', top: '0', width: '20%', height: '100%' },
          delayMs: 700,
        },
      ],
    },
    cues: [
      { cue: 'relay', atMs: 0 },
      { cue: 'alarm', atMs: 550 },
    ],
    lines: [{ actor: 'system', label: 'ระบบนิรภัย', text: 'ถอดกุญแจยืนยันคำสั่งออกจากระบบ' }],
  },
  {
    id: 'contract',
    title: 'งานจากอาราซาก้า',
    location: 'สัญญาว่าจ้าง / ช่องทางเข้ารหัส',
    art: '/assets/blackbox/briefing.webp',
    description: 'คินรับการติดต่อจากอาราซาก้า หน้าจอแสดง BLACKBOX และสถานีสื่อสารฉุกเฉิน 3 แห่ง',
    connection: 'secure',
    reveal: 'anonymous',
    composition: {
      name: 'briefing',
      layers: [
        {
          id: 'emergency-network',
          kind: 'network',
          placement: { left: '48%', top: '24%', width: '36%', height: '29%' },
          delayMs: 150,
        },
        { id: 'kin', kind: 'kin', placement: { left: '18%', bottom: '24%', height: '53%' } },
      ],
    },
    cues: [{ cue: 'connect', atMs: 0 }],
    lines: [
      {
        actor: 'arasaka',
        label: 'ผู้ประสานงานอาราซาก้า',
        text: 'ถ้าเขาปลอมคำสั่งได้ ทีมกู้ภัยอาจถูกส่งผิดที่ เราต้องได้ BLACKBOX คืน',
      },
      { actor: 'kin', label: 'คิน', text: 'แล้วทำไมต้องเป็นผม?' },
      {
        actor: 'arasaka',
        label: 'ผู้ประสานงานอาราซาก้า',
        text: 'เขาทิ้งหมายเลขหน่วยเก่าของคุณไว้',
      },
    ],
  },
  {
    id: 'missing-partner',
    title: 'คู่หูที่หายไป',
    location: 'ความทรงจำ / ภารกิจครั้งสุดท้าย',
    art: '/assets/blackbox/memory.webp',
    description:
      'คินกับคู่หูซ่อมเครื่องสื่อสารร่วมกันในอดีต คู่หูหันหลัง ไม่เห็นใบหน้า ก่อนภาพย้อนกลับสู่หลักฐานหน่วยเก่า',
    connection: 'archive',
    reveal: 'familiar',
    composition: { name: 'memory', layers: [{ id: 'memory-trace', kind: 'memory', delayMs: 350 }] },
    cues: [
      { cue: 'rain', atMs: 0 },
      { cue: 'relay', atMs: 800 },
    ],
    lines: [
      {
        actor: 'partner',
        label: 'คู่หู · ในอดีต',
        text: 'เปิดต้นฉบับดู นายเชื่อรายงานคนอื่นง่ายไปแล้ว',
      },
      { actor: 'kin', label: 'คิน · ปัจจุบัน', text: 'หมายเลขนี้เลิกใช้ไปตั้งแต่เขาหายตัว' },
    ],
  },
  {
    id: 'first-trace',
    title: 'ร่องรอยแรก',
    location: 'ข้อความพยาน / แฟ้มร้านอรุณ CAM-07',
    art: '/assets/entry/shop.webp',
    description:
      'คินตรวจแฟ้มและข้อความจากร้านช่างอรุณ ก่อนออกเดินทาง พบว่าภาพหายไปเฉพาะช่วงที่ BLACKBOX ผ่านพื้นที่',
    connection: 'local',
    reveal: 'familiar',
    composition: {
      name: 'shop',
      layers: [
        { id: 'rain', kind: 'rain' },
        { id: 'evidence-file', kind: 'file', delayMs: 200 },
      ],
    },
    cues: [{ cue: 'relay', atMs: 0 }],
    lines: [
      {
        actor: 'arun',
        label: 'อรุณ',
        text: 'เขาลบเฉพาะช่วงที่เดินผ่านร้าน ก่อนหน้านั้นยังอยู่ครบ',
      },
      { actor: 'kin', label: 'คิน', text: 'เก็บเครื่องไว้ ผมจะตรวจต้นฉบับ' },
    ],
  },
  {
    id: 'waiting-signal',
    title: 'คนที่รออยู่',
    location: 'สัญญาณแทรก / ไม่ทราบต้นทาง',
    art: '/assets/entry/null.webp',
    description:
      'คนร้ายใช้ชื่อแฝง NULL แทรกสัญญาณเข้าจอและท้าคินตามเอา BLACKBOX คืน ยังไม่เปิดชื่อจริง',
    connection: 'intercept',
    reveal: 'alias',
    composition: { name: 'intercept', layers: [{ id: 'signal-cut', kind: 'signal' }] },
    cues: [
      { cue: 'static', atMs: 0 },
      { cue: 'connect', atMs: 300 },
    ],
    lines: [
      { actor: 'intruder', label: 'NULL', text: 'ยังอ่านแต่รายงานที่เขายื่นให้อีกเหรอ คิน?' },
      { actor: 'kin', label: 'คิน', text: 'นายรู้เรื่องหน่วยเก่าได้ยังไง?' },
      {
        actor: 'intruder',
        label: 'NULL',
        text: 'อยากได้ BLACKBOX คืน ก็ตามมา แล้วดูเองว่าอาราซาก้าตัดอะไรออก',
      },
    ],
  },
]

export const titleComposition = {
  name: 'lab',
  layers: [
    { id: 'rain', kind: 'rain' },
    { id: 'monitor', kind: 'monitor' },
    { id: 'kin', kind: 'kin' },
    { id: 'beacon', kind: 'beacon' },
  ],
} satisfies StoryShot['composition']

/** One case record feeds cinematic, field HUD and case-file display adapters. */
export const caseNarrative = {
  id: 'blackbox',
  title: 'คดี BLACKBOX',
  openingTitle: 'กุญแจที่ถูกขโมย',
  artifact,
  camera,
  firstObjective,
  opening,
  hero: { name: 'คิน', unit: 'TechCare', missingPartner: true },
  employer: {
    name: artifact.owner,
    role: 'ผู้ว่าจ้างและผู้ดูแลเครือข่าย',
    withholdsInformation: true,
  },
  antagonist: {
    alias: 'NULL',
    identityConfirmed: false,
    motive: 'ทิ้งทางให้คินตรวจสิ่งที่ผู้ว่าจ้างปิดบัง',
  },
  menu: {
    tagline: ['BLACKBOX ถูกขโมย', 'เบาะแสพาดพิงคู่หูที่หายไป'],
    status: 'กุญแจยืนยันคำสั่ง / สูญหาย',
  },
  field: {
    map: {
      name: 'ย่านฝั่งตะวันออก',
      sub: 'EAST BANK · DISTRICT 07',
      objective: firstObjective,
      detail: 'เดินทางไปพบอรุณ แล้วกู้หลักฐานการขนย้ายก่อนร่องรอยจะหายไป',
    },
    street: {
      name: 'ร้านช่างอรุณ',
      sub: 'ตอน 01 / ร่องรอยการขนย้าย',
      objective: 'ตรวจช่วงเวลาที่ถูกลบ',
      detail: 'คุยกับอรุณ แล้วตรวจ CAM-07 เพื่อหาเส้นทางของผู้ถือ BLACKBOX',
    },
    device: {
      name: 'ภายในเครื่องบันทึกกล้อง',
      sub: 'CAM-07 / EVIDENCE RECOVERY',
      objective: 'กู้หน้าหลักฐานการขนย้าย',
      detail: 'ซ่อมหน้ารายงาน HTML เพื่ออ่านหลักฐาน ไม่ใช่เข้าควบคุมเครือข่ายจริง',
    },
    boss: {
      name: 'ห้องกักกัน WATCHER',
      sub: 'ตอน 01 / เกราะข้อมูลหลักฐาน',
      objective: 'คืนข้อมูลที่ถูกปิดกั้น',
      detail: 'ตัวอย่างโจทย์ปลดเกราะหลักฐาน เพื่ออ่านร่องรอยสถานีถัดไป',
    },
  },
  brief: {
    title: 'ตามกุญแจยืนยันคำสั่งกลับมา',
    paragraphs: [
      'BLACKBOX ถูกขโมยจากห้องนิรภัยอาราซาก้า เวลา 03:12 น. อุปกรณ์นี้ใช้ยืนยันคำสั่งในเครือข่ายสื่อสารฉุกเฉินระดับประเทศ ผู้ถืออาจปลอมประกาศเตือนภัยหรือเปลี่ยนคำสั่งส่งทีมกู้ภัยได้',
      'ก่อนใช้งานเต็มรูปแบบต้องเชื่อมผ่านสถานีสำคัญ 3 แห่ง อาราซาก้าจ้างคินตามของคืน พร้อมหลักฐานหมายเลขหน่วยเก่าที่เลิกใช้หลังคู่หูของเขาหายตัว คินยังไม่รู้ว่าใครเป็นคนทิ้งมันไว้',
      'เริ่มที่ร้านอรุณ กู้หน้าหลักฐานจาก CAM-07 แล้วตามเส้นทางการขนย้าย กล้องเป็นเบาะแสในคดี ส่วน BLACKBOX คือของที่ต้องนำกลับมา',
    ],
  },
  witness: {
    title: '“เขาลบเฉพาะช่วงที่เดินผ่านร้าน”',
    account:
      'อรุณ: ผมเห็นคนถือกล่องสีดำผ่านหน้าร้าน พอเปิดภาพดู ช่วงนั้นหายไปพอดี แต่ภาพก่อนหน้ายังอยู่ เครื่องอาจเก็บต้นฉบับไว้',
    reply: 'คิน: เก็บเครื่องไว้ ผมจะตรวจต้นฉบับ ถ้ายังเหลือภาพ เราจะรู้ว่าเขาไปทางไหน',
  },
  journal: [
    {
      title: 'BLACKBOX ถูกขโมย',
      detail: 'ทรัพย์สินอาราซาก้า ใช้ยืนยันคำสั่งของเครือข่ายฉุกเฉิน ต้องผ่านสถานีสำคัญ 3 แห่ง',
    },
    {
      title: 'หมายเลขหน่วยเก่า',
      detail: 'ผู้ว่าจ้างส่งหลักฐานนี้ให้คิน ยังไม่ยืนยันว่าเกี่ยวกับคู่หูที่หายตัวอย่างไร',
    },
    {
      title: 'หลักฐานที่ร้านอรุณ',
      detail: 'CAM-07 ถูกลบเฉพาะช่วงการขนย้าย ต้องกู้หน้ารายงานเพื่ออ่านเส้นทาง',
    },
  ],
  city: {
    arunSummary:
      'ภาพบันทึกจากร้านอรุณอาจบอกเส้นทางของผู้ถือ BLACKBOX ซ่อมหน้าหลักฐานเพื่ออ่านข้อมูลที่เหลือ',
    relay: {
      summary: 'ร่องรอยจาก CAM-07 ตรงกับจุดส่งสัญญาณฝั่งตะวันออก เปิดตรวจบันทึกสถานีได้แล้ว',
      lead: 'มีการส่งหมายเลขชุดอุปกรณ์ต่อไปยังศูนย์ควบคุม',
      paragraphs: [
        'บันทึกสถานีระบุว่ามีอุปกรณ์ใช้หมายเลขชุดเดียวกับ BLACKBOX ติดต่อเข้ามาหลังเหตุโจรกรรม ช่องนี้ไม่ได้อยู่ในรายงานสรุปของผู้ว่าจ้าง',
        'ปลายทางของรายการส่งต่อคือศูนย์ควบคุมเครือข่าย บันทึกเบาะแสนี้เพื่อเปิดตำแหน่งบนแผนที่',
        'รอบนี้เปิดให้สำรวจข่าวกรองเท่านั้น ภารกิจภาคสนามและโจทย์สื่อเสียงของสถานียังอยู่ในแผนพัฒนาถัดไป',
      ],
    },
    control: {
      summary: 'ตำแหน่งศูนย์ควบคุมมาจากบันทึกสถานีสื่อสาร มีข้อมูลรายงานที่ต้องตรวจเทียบ',
      lead: 'รายงานสองฉบับระบุช่วงเวลาส่งคำสั่งไม่ตรงกัน',
      paragraphs: [
        'ข้อมูลที่ได้รับจากสถานีมีช่วงเวลาส่งคำสั่งเพิ่มจากรายงานของอาราซาก้า ยังบอกไม่ได้ว่าใครเป็นคนตัดรายการนั้นออก',
        'คินเก็บข้อมูลไว้ตรวจต่อ การเห็นหมายเลขหน่วยเก่าหรือชื่อแฝง NULL ยังไม่ยืนยันว่าคู่หูที่หายไปเป็นคนร้าย',
        'นี่คือจุดจบของเส้นทางข่าวกรองในต้นแบบแผนที่ ภารกิจเต็มของศูนย์ควบคุมและการเปิดใช้ BLACKBOX ยังไม่เกิดขึ้น',
      ],
    },
  },
  worldLabels: {
    cameraOffline: `${camera.id} / OFFLINE`,
    cameraRecovery: `${camera.id} / TRANSIT EVIDENCE`,
  },
} as const
