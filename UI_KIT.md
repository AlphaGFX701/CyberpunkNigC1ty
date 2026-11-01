# TechCare Pixel UI — version 1.0

ชุด UI ต้นฉบับสำหรับเกม TechCare: รอยต่อสัญญาณ วาดจากรูปทรงพิกเซลด้วยโค้ด ไม่ได้นำภาพจากแพ็กอ้างอิงมาตัดหรือเปลี่ยนสี

## ใช้และดาวน์โหลด

- หน้าแสดงชุด: http://127.0.0.1:5180/?ui=1
- เกม: http://127.0.0.1:5180/
- ZIP: public/assets/ui/techcare-pixel-ui.zip
- PNG แยก 55 ชิ้น: public/assets/ui/png/
- Atlas: public/assets/ui/atlas.png และ atlas.json
- ขนาดและขอบ nine-slice: public/assets/ui/manifest.json
- ต้นฉบับ SVG 55 ชิ้น: ui-source/svg/
- ภาพรวมทุกชิ้น: ui-source/overview.png

## จำนวนและขนาด

| กลุ่ม             | จำนวน | ขนาดต้นฉบับ                                |
| ----------------- | ----: | ------------------------------------------ |
| Buttons           |    16 | 64×24, ปุ่มไอคอน 24×24                     |
| Panels            |     7 | 48×48, tooltip/minimap 32×32, keycap 24×24 |
| Bars              |     6 | กรอบ 96×16, ส่วนเติม 80×8                  |
| Shields           |     2 | 16×16                                      |
| Slots             |     3 | 32×32                                      |
| Icons             |    12 | 16×16                                      |
| Quest markers     |     3 | 16×20                                      |
| Cursor / selector |     2 | 16×16, 32×32                               |
| Minimap markers   |     4 | 16×16                                      |

รวม 55 ชิ้น ไม่รวม atlas ภาพรวม หรือภาพฉากสำหรับแสดงตัวอย่าง

## ภาพและสี

พื้น #1b303b, เงา #09151f, ขอบโลหะ #617f85, ฟ้าระบบ #90c5c0, อำพันภารกิจ #e7bf77, ชมพูเฉลย #ed9fba และเขียวสำเร็จ #a6d8b0

สไปรต์ไม่มีตัวหนังสือ ไทยใช้ IBM Plex Sans Thai จากแอปเดิม รหัสใช้ IBM Plex Mono ฟอนต์ไม่ได้รวมใน Asset ZIP

ปุ่มทุกแบบมี normal, hover, pressed, disabled เลือกภาพจาก state จริง มี outline เมื่อโฟกัสด้วยคีย์บอร์ด Disabled เป็นปุ่ม disabled จริง

## Nine-slice

แต่ละชิ้นที่ยืดได้มี `nineSlice: {top,right,bottom,left}` ใน manifest หน่วยเป็นพิกเซลของภาพต้นฉบับ ไม่ใช่เปอร์เซ็นต์

ตัวอย่าง window: slice 8px ทุกด้าน แสดงที่ 2× ใช้ border width 16px มุมคงสัดส่วนเดิม พื้นที่ตรงกลางยืดรองรับข้อความ

```css
.example {
  border: 16px solid transparent;
  border-image: url('/assets/ui/png/panel-window.png') 8 fill / 16px stretch;
  image-rendering: pixelated;
}
```

ขยาย PNG ด้วย nearest-neighbor ใช้อัตรา 1×, 2× หรือ 3× สำหรับไอคอน ปิด smoothing ใน canvas

## React

```tsx
import { PixelButton, PixelPanel, PixelBar } from './ui/PixelUI'

<PixelPanel variant="dialogue">
  <p>ตรวจเครื่องบันทึกกล้องก่อนออกจากร้าน</p>
  <PixelButton variant="primary" onClick={inspect}>ตรวจเครื่อง</PixelButton>
  <PixelButton variant="solution" onClick={reveal}>ดูเฉลย</PixelButton>
</PixelPanel>
<PixelBar kind="boss" value={70} max={100} label="เกราะ WATCHER" segments={3}/>
```

โหลด CSS ตามลำดับ: base style → ui/pixel.css → gallery.css โทนสีแอปใช้ --amber, --cyan, --muted, --line และ --bg ใน base stylesheet

PixelPanel เก็บ semantic props และ ref ได้ Modal เดิมยังรับผิดชอบ focus trap และการหยุดเดิน PixelPanel รับผิดชอบภาพกรอบ

PixelSlot และ PixelShields เป็นข้อมูลประกอบ ส่วนไอคอน SFX และมินิแมพอยู่ในหน้าแสดงชุดจนกว่าจะพัฒนาระบบจริง

## Phaser

```ts
this.load.atlas('pixel-ui', '/assets/ui/atlas.png', '/assets/ui/atlas.json')
this.add.image(x, y, 'pixel-ui', 'quest-new').setScale(2)
```

ชื่อเฟรมใช้ชื่อไฟล์โดยไม่มี .png Atlas ไม่ trim และไม่หมุนภาพ มีพื้นที่ว่างระหว่างเฟรมอย่างน้อย 4px

## แก้ไขต้นฉบับ

ติดตั้ง Node.js แล้วรัน npm install ในโปรเจกต์ หรือ ZIP standalone ที่แนบ package.json สำหรับติดตั้ง sharp

1. เปลี่ยน geometry/palette ใน tools/build-ui.mjs แล้วรัน `node tools/build-ui.mjs` เพื่อสร้างใหม่ทั้งหมด คำสั่งนี้เขียน SVG และ PNG ใหม่ จึงทับการแก้ SVG โดยตรง
2. หากแก้ SVG แยกชิ้น ให้คงขนาดภาพเดิม แล้วรัน `node tools/export-ui.mjs` เพื่อส่งออก PNG/atlas ใหม่ โดยไม่วาดทับ SVG
3. manifest.generated.json เป็นสำเนาที่เครื่องมือสร้างให้ TypeScript รู้ชื่อ Asset อย่าแก้แยกจาก manifest หลัก
4. ในโปรเจกต์เกม ตรวจ `npm test`, `npx playwright test` และ `npm run build` ก่อนใช้งาน
5. สร้าง ZIP ด้วย `powershell -File tools/package-ui.ps1` เมื่อใช้ในโปรเจกต์ Windows นี้

## ตรวจรับและที่มา

ตรวจจำนวน 55 PNG/55 SVG, alpha, native dimensions, nine-slice, สถานะปุ่ม และเทียบพิกเซลกับ atlas ทดสอบทั้งสี่ฉาก หน้าต่างไทย โจทย์ เฉลย การหยุดเดิน เสียง และหน้าแสดงชุดจอแคบ

ภาพอ้างอิง: https://deadrevolver.itch.io/pixel-ui-hud-pack ใช้ศึกษาโครงสร้างประเภท UI ไม่รวมไฟล์ของผู้สร้างนั้นในงานส่งมอบ
