import { expect, type Page } from '@playwright/test'
import { expectNoAnswers } from './no-answers'

export async function solveRelayPuzzle(page: Page, index: number) {
  await expectNoAnswers(page)
  const board = page.locator('.relay-puzzle')
  if (index === 0) {
    await board.getByRole('button', { name: 'ต้นทาง แฟ้มสถานี', exact: true }).click()
    await board.getByRole('button', { name: 'ปลายทาง station.html', exact: true }).click()
    await board.getByRole('button', { name: 'ต้นทาง บันทึกรับอุปกรณ์', exact: true }).click()
    await board.getByRole('button', { name: 'ปลายทาง logs/arrival.html', exact: true }).click()
  } else if (index === 1) {
    await board.getByRole('button', { name: 'เปิดโฟลเดอร์ logs', exact: true }).click()
    await board.getByRole('button', { name: 'เลือกแฟ้ม logs/arrival.html', exact: true }).click()
  } else if (index === 2) {
    await board.getByRole('button', { name: 'เป้าหมาย after-theft', exact: true }).click()
  } else if (index === 3) {
    await board.getByRole('button', { name: 'เลือกอุปกรณ์ BLACKBOX-17', exact: true }).click()
    await board.getByRole('button', { name: 'เลือกอุปกรณ์ RELAY-02', exact: true }).click()
  } else if (index === 4) {
    for (const name of ['03:16 รับอุปกรณ์', '03:18 เชื่อมต่อ', '03:21 ส่งต่อ'])
      await board.getByRole('button', { name, exact: true }).click()
  } else if (index === 5) {
    await board.getByRole('button', { name: 'บันทึก RELAY-02', exact: true }).click()
    await board.locator('.relay-zone.header').click()
    await board.getByRole('button', { name: 'รายการส่งต่อ 03:21', exact: true }).click()
    await board.locator('.relay-zone.main').click()
    await board.getByRole('button', { name: 'แหล่งข้อมูล: RELAY-02', exact: true }).click()
    await board.locator('.relay-zone.footer').click()
  } else {
    const cards = board.locator('.relay-classifier article')
    await cards
      .filter({ hasText: '03:18 เชื่อมต่อ' })
      .getByRole('button', { name: 'รายการส่งข้อมูล', exact: true })
      .click()
    await cards
      .filter({ hasText: 'ไม่อยู่ในรายงาน' })
      .getByRole('button', { name: 'หมายเหตุ', exact: true })
      .click()
    await cards
      .filter({ hasText: '03:21 ส่งต่อ' })
      .getByRole('button', { name: 'รายการส่งข้อมูล', exact: true })
      .click()
    await cards
      .filter({ hasText: 'ใบงานมีหมายเลข' })
      .getByRole('button', { name: 'หมายเหตุ', exact: true })
      .click()
  }
  await page.screenshot({ path: `evidence/relay/puzzle-${index + 1}.png` })
  await board.getByRole('button', { name: 'ตรวจ Puzzle → เขียน HTML', exact: true }).click()
  await expect(page.locator('.cm-content')).toBeVisible()
  await expectNoAnswers(page)
}
