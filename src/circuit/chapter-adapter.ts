import { chapter, chapterScore, tasks } from '../chapter/model'
import { relay, relayScore } from '../relay/model'
import { tasks as relayTasks, finalTask as relayFinal } from '../relay/content'
import { CIRCUIT_STAGES } from './model-geometry'
import { RELAY_STAGES } from './relay-geometry'

export type CircuitChapterId = 'arun' | 'relay'
type MapSnapshot = {
  readonly completed: readonly number[]
  readonly imageRecovered?: boolean
  readonly finalRecovered?: boolean
}

/** Two real chapter adapters keep learning rules outside the map renderer. */
export function circuitChapter(id: CircuitChapterId) {
  if (id === 'relay')
    return {
      id,
      stages: RELAY_STAGES,
      subscribe: relay.subscribe,
      get: relay.get as () => MapSnapshot,
      recovered: (state: MapSnapshot) => state.finalRecovered === true,
      score: () => relayScore(relay.get()),
      canOpenTask: relay.canOpenTask,
      canOpenFinal: relay.canRecoverImage,
      instruction: (index: number) =>
        index === 7 ? relayFinal.instruction : relayTasks[index].instruction,
      heading: 'RELAY-02 · เชื่อมแฟ้มก่อนอ่านบันทึกต้นฉบับ',
      success: 'กู้บันทึกต้นฉบับสำเร็จ',
      finalObjective: 'เปิดหอบันทึกต้นฉบับกลางเมือง',
      finalLabel: 'บันทึก',
      finalAction: 'กู้บันทึกต้นฉบับ',
      returnLabel: 'กลับสถานีสื่อสาร ↗',
      line: (count: number, recovered: boolean) =>
        recovered
          ? 'ต้นฉบับอยู่ครบ แต่รายงานที่เราได้มาไม่ครบ เก็บสองฉบับนี้ไว้ ไปถามศูนย์ควบคุมกัน'
          : count === 7
            ? 'แฟ้มเชื่อมครบแล้ว หอบันทึกเปิดอยู่กลางเมือง คราวนี้ดูของจริง ไม่อ่านแต่บทสรุป'
            : `ระบบส่วนที่ ${count} คืนมาแล้ว ไปเขตถัดไปกัน คนลบแฟ้มคงไม่คิดว่าเราจะอ่านละเอียดขนาดนี้`,
    }
  return {
    id,
    stages: CIRCUIT_STAGES,
    subscribe: chapter.subscribe,
    get: chapter.get as () => MapSnapshot,
    recovered: (state: MapSnapshot) => state.imageRecovered === true,
    score: () => chapterScore(chapter.get()),
    canOpenTask: chapter.canOpenTask,
    canOpenFinal: chapter.canRecoverImage,
    instruction: (index: number) =>
      index === 7
        ? 'กู้หน้าแสดงภาพด้วย img, src และ alt เพื่อเห็นผู้ต้องสงสัย'
        : tasks[index].instruction,
    heading: 'ARUN-01 · กู้โครงสร้างก่อนเปิดภาพ CAM-07',
    success: 'กู้ภาพ CAM-07 สำเร็จ',
    finalObjective: 'เปิดหอกล้องกลางเมือง',
    finalLabel: 'ภาพ',
    finalAction: 'กู้ภาพ CAM-07',
    returnLabel: 'กลับร้านอรุณ ↗',
    line: (count: number, recovered: boolean) =>
      recovered
        ? 'ภาพกลับมาแล้ว เก็บไว้ก่อน คราวนี้เราไปถามคนที่อยู่ในภาพกัน'
        : count === 7
          ? 'ครบเจ็ดส่วนแล้ว หอกล้องเปิดอยู่กลางเมือง เข้าไปดูว่าใครทำลุงเสียเงินฟรี'
          : `เขต ${count} กลับมาทำงานแล้ว ไปจุดถัดไปกัน อย่าเพิ่งขอค่าแรงจากลุงล่ะ`,
  }
}
