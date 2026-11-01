import { privateAnswers } from '../private-answers'
import { test, expect, type Page } from '@playwright/test'
import { enterGame } from './helpers'

test.use({ viewport: { width:1280,height:720 }, actionTimeout:15000 })
// Presentation fixtures advance through real model validators; this is not an end-to-end learning test.
async function fixture(page:Page,phase:'arrive'|'traces'|'conclusion') {
 return page.evaluate(async ({phase,answers})=>{
  const urls=performance.getEntriesByType('resource').map(r=>r.name)
  const module=async(path:string)=>import(urls.findLast(u=>u.includes(path)&&u.match(/\.(ts|tsx)(?:\?|$)/))??path)
  const {relay}=await module('/src/relay/model.ts')
  const {cityProgress}=await module('/src/city/progression.ts')
  const {enterField,store}=await module('/src/model.ts')
  if(phase==='arrive'){cityProgress.recordCamRecovery();relay.markStory('departure');enterField('relay');return}
  relay.talkToOfficer();relay.collectClue('workorder');relay.collectClue('module')
  if(phase==='traces'){store.set({overlay:'hack'});return}
  relay.startHack()
  const {puzzles}=await module('/src/relay/puzzles.ts')
  for(let i=0;i<7;i++){if(!relay.submitPuzzle(i,puzzles[i].solution).ok||!relay.submitTask(i,answers[i]).ok)throw new Error('Invalid presentation fixture '+i)}
  if(!relay.submitImage(answers[7]).ok)throw new Error('Invalid final presentation fixture')
 },{phase,answers:privateAnswers.relay})
}
async function fitsText(page:Page){
 const text=page.locator('.modal-backdrop[data-placement="dialogue"] .dialogue-surface__text')
 await expect.poll(()=>text.evaluate(e=>e.clientHeight)).toBeGreaterThan(40)
 const sizes=await text.evaluate(e=>({client:e.clientHeight,scroll:e.scrollHeight}))
 expect(sizes.scroll).toBeLessThanOrEqual(sizes.client+1)
}
test('relay speech, connection guidance and record comparison stay readable in the bottom dock',async({page})=>{
 test.setTimeout(90000)
 await enterGame(page);await fixture(page,'arrive')
 const arrival=page.getByRole('dialog',{name:'สถานีที่ควรปิด',exact:true})
 await expect(arrival).toBeVisible()
 await fitsText(page)
 await page.screenshot({path:'evidence/dialogue/relay-arrival-1280.png'})
 await arrival.getByRole('button',{name:'ข้ามบท',exact:true}).click()
 await fixture(page,'traces')
 await expect(page.getByRole('dialog',{name:'RELAY-02 / เชื่อมเครื่องกู้บันทึก',exact:true})).toBeVisible()
 await fitsText(page)
 await page.screenshot({path:'evidence/dialogue/relay-traces-1280.png'})
 await page.keyboard.press('Escape')
 await fixture(page,'conclusion')
 const end=page.getByRole('dialog',{name:'บันทึกที่ถูกตัด',exact:true})
 await expect(end).toBeVisible()
 for(const[width,height]of[[1280,720],[1440,900],[1920,1080]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250)
  await fitsText(page)
  const sharp=page.locator('.relay-evidence-above')
  const bounds=await sharp.boundingBox()
  expect(bounds!.y).toBeGreaterThan(8)
  expect(await sharp.evaluate(e=>getComputedStyle(e).filter)).toBe('none')
  await page.screenshot({path:`evidence/dialogue/relay-conclusion-${width}.png`})
 }
})
