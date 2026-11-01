export type RelayStoryId = 'departure' | 'arrival' | 'witness' | 'traces' | 'conclusion'
export type RelayLine = {
  speaker: 'คิน' | 'อรุณ' | 'เจ้าหน้าที่เวร' | 'NULL' | 'ระบบ'
  text: string
}
export const relayStory: Record<
  RelayStoryId,
  { title: string; location: string; art: string; lines: RelayLine[] }
> = {
  departure: {
    title: 'ก่อนออกจากร้าน',
    location: 'ARUN / CAM-07 → RELAY-02',
    art: '/assets/chapter-one/scenes/arun-workshop.webp',
    lines: [
      {
        speaker: 'คิน',
        text: 'ภาพกับตัวส่งชี้ไปที่เดียวกัน สถานีฝั่งตะวันออก คนถือ BLACKBOX ผ่านที่นั่น',
      },
      { speaker: 'อรุณ', text: 'เจอคนที่เอามาฝากเมื่อไร บอกด้วยว่ายังติดค่าซ่อมฉันอยู่' },
      { speaker: 'คิน', text: 'ได้ครับลุง ผมตามของระดับประเทศอยู่ แวะทวงบิลให้ด้วยก็ได้' },
      { speaker: 'ระบบ', text: 'บันทึกพิกัดสถานีสื่อสารแล้ว เลือกจุดหมายบนแผนที่เพื่อเดินทาง' },
    ],
  },
  arrival: {
    title: 'สถานีที่ควรปิด',
    location: 'RL / 02 · ฝั่งตะวันออก · แนวเสาสัญญาณ',
    art: '/assets/relay/scenes/station.webp',
    lines: [
      { speaker: 'ระบบ', text: 'สถานีสื่อสารฝั่งตะวันออก · คำสั่งระงับการใช้งานยังมีผล' },
      { speaker: 'คิน', text: 'ป้ายบอกปิด แต่เสายังส่งอยู่ ขยันกว่าเจ้าของป้ายอีก' },
      { speaker: 'คิน', text: 'ถามคนเฝ้าก่อน แล้วค่อยตามสายเข้าไป เรามาหาบันทึก ไม่ได้มาปีนรั้ว' },
    ],
  },
  witness: {
    title: 'ใบงานที่ผ่านประตู',
    location: 'RELAY / เจ้าหน้าที่เวร',
    art: '/assets/relay/scenes/station.webp',
    lines: [
      {
        speaker: 'คิน',
        text: 'ผมตามอุปกรณ์ที่ผ่านร้านอรุณมา ที่นี่มีคนเข้าซ่อมหลังเหตุที่อาราซาก้าหรือเปล่า?',
      },
      {
        speaker: 'เจ้าหน้าที่เวร',
        text: 'มีคนหนึ่ง เขามีใบงานครบ ผมเลยเปิดทางให้ หลังจากนั้นบันทึกก็อ่านไม่ได้',
      },
      { speaker: 'คิน', text: 'ขอดูใบงานหน่อยครับ คนทำเอกสารเรียบร้อยไม่ได้แปลว่ามาดีทุกคน' },
      {
        speaker: 'เจ้าหน้าที่เวร',
        text: 'แฟ้มอยู่โต๊ะทางซ้าย โมดูลบันทึกยังเสียบอยู่ฐานเสาฝั่งขวา ผมจะเปิดประตูซ่อมบำรุงให้',
      },
      { speaker: 'คิน', text: 'ดีครับ อย่างน้อยวันนี้ผมก็ไม่ต้องเขียนใบงานเพิ่มอีกใบ' },
    ],
  },
  traces: {
    title: 'ร่องรอยที่ตั้งใจทิ้ง',
    location: 'RELAY-02 / เชื่อมหลักฐานก่อนกู้ข้อมูล',
    art: '/assets/relay/scenes/station.webp',
    lines: [
      { speaker: 'คิน', text: 'เลขหน่วยนี้เลิกใช้ไปแล้ว ใครเขียนไว้ก็รู้ว่าฉันต้องจำได้' },
      {
        speaker: 'คิน',
        text: 'โมดูลเจอหมายเลข BLACKBOX-17 แต่หน้าบันทึกขาดอยู่หลายส่วน เข้า RELAY-02 แล้วกู้ทีละเขต',
      },
    ],
  },
  conclusion: {
    title: 'บันทึกที่ถูกตัด',
    location: 'RELAY-02 / ORIGINAL RECORD · 03:21',
    art: '/assets/relay/scenes/station.webp',
    lines: [
      {
        speaker: 'คิน',
        text: 'BLACKBOX-17 ส่งข้อมูลไปศูนย์ควบคุมหลังเหตุโจรกรรม แต่รายงานที่อาราซาก้าให้เราไม่มีรายการนี้',
      },
      { speaker: 'NULL', text: 'เจอแล้วนี่ รายการที่นายไม่ได้รับอนุญาตให้อ่าน' },
      { speaker: 'คิน', text: 'นายส่งมันเอง หรือแค่อยากให้ฉันคิดแบบนั้น?' },
      { speaker: 'NULL', text: 'ต้นฉบับอยู่ศูนย์ควบคุม ไปถามคนจ้างนายดู' },
      {
        speaker: 'คิน',
        text: 'เก็บทั้งสองฉบับไว้ เรายังไม่รู้ว่าใครตัดรายการ แต่รู้แล้วว่าต้องไปถามที่ไหน',
      },
    ],
  },
}
