import { expect, type Page } from '@playwright/test'

/** Question surfaces must never expose a completed answer or an answer-fill control. */
export async function expectNoAnswers(page: Page) {
  await expect(page.getByRole('button', { name: /เฉลย|เติมคำตอบ|คำตอบสำเร็จ/ })).toHaveCount(0)
  await expect(page.locator('.solution,.repair-solution')).toHaveCount(0)
}
