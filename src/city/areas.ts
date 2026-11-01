import { caseNarrative } from '../narrative/case'
import type { AreaId, CityProgressSnapshot } from './progression'

export type CityArea = {
  id: AreaId
  name: string
  code: string
  district: string
  kind: 'base' | 'mission' | 'intel'
  summary: string
  task: string
  evidence: string
  intel?: { lead: string; paragraphs: readonly string[] }
}
/** Narrative text stays with the case owner; this adapter adds map-display roles. */
export const cityAreas: readonly CityArea[] = [
  {
    id: 'base',
    name: 'ฐาน TechCare',
    code: 'TC / 00',
    district: 'ฝั่งตะวันตก · เขตปฏิบัติการ',
    kind: 'base',
    summary: 'จุดประสานงานของคินและแฟ้มคดี BLACKBOX',
    task: 'ตรวจแฟ้มก่อนออกเดินทาง',
    evidence: 'สัญญาว่าจ้างจากอาราซาก้า',
  },
  {
    id: 'arun',
    name: 'ร้านช่างอรุณ',
    code: 'AR / 01',
    district: 'ฝั่งตะวันตก · ย่านร้านช่าง',
    kind: 'mission',
    summary: caseNarrative.city.arunSummary,
    task: 'กู้หน้าหลักฐาน CAM-07 ด้วย HTML',
    evidence: 'ภาพการขนย้ายที่ถูกลบ',
  },
  {
    id: 'relay',
    name: 'สถานีสื่อสาร',
    code: 'RL / 02',
    district: 'ฝั่งตะวันออก · แนวเสาสัญญาณ',
    kind: 'intel',
    summary: caseNarrative.city.relay.summary,
    task: 'อ่านและบันทึกข่าวกรอง',
    evidence: 'เวลาส่งสัญญาณและจุดหมายต่อไป',
    intel: caseNarrative.city.relay,
  },
  {
    id: 'control',
    name: 'ศูนย์ควบคุม',
    code: 'NX / 03',
    district: 'ฝั่งตะวันออก · เขตศูนย์กลาง',
    kind: 'intel',
    summary: caseNarrative.city.control.summary,
    task: 'ตรวจข้อมูลพื้นที่และเบาะแส',
    evidence: 'บันทึกคำสั่งที่รายงานไม่ตรงกัน',
    intel: caseNarrative.city.control,
  },
]
export const areaById = (id: AreaId) => cityAreas.find((a) => a.id === id)!
export function currentObjective(progress: CityProgressSnapshot) {
  if (!progress.completed.includes('recover-cam07')) return caseNarrative.firstObjective
  if (!progress.completed.includes('read-relay'))
    return 'อ่านข่าวกรองที่สถานีสื่อสาร เพื่อตามสัญญาณ BLACKBOX'
  if (!progress.completed.includes('read-control'))
    return 'ตรวจบันทึกศูนย์ควบคุม แล้วเชื่อมเบาะแสของผู้ว่าจ้าง'
  return 'บันทึกข้อมูลครบแล้ว · รอภารกิจภาคสนามตอนถัดไป'
}
