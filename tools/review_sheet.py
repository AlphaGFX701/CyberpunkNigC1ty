"""Assemble actual browser captures into the visual-review contact sheet."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
output = Image.new('RGB', (1320, 860), '#101d26')
draw = ImageDraw.Draw(output)
font = ImageFont.truetype('C:/Windows/Fonts/LeelawUI.ttf', 21)
small = ImageFont.truetype('C:/Windows/Fonts/LeelawUI.ttf', 14)
draw.text((20, 12), 'TechCare: รอยต่อสัญญาณ — ฉากตัวอย่างระยะที่ 1', font=font, fill='#e7bf77')
for index, (name, title) in enumerate([
    ('map', '01  แผนที่คดี / เดินตามถนน'),
    ('street', '02  ฉากสืบสวน / เดิน 4 ทิศ'),
    ('device', '03  ภายในอุปกรณ์ / คินตัวจิ๋ว'),
    ('boss', '04  ห้องบอส / กลับเป็นร่างปกติ'),
]):
    x = 20 + (index % 2) * 650
    y = 54 + (index // 2) * 397
    draw.text((x, y), title, font=font, fill='#dfe7df')
    shot = Image.open(root / 'evidence' / f'{name}.png').convert('RGB')
    shot = shot.crop((53, 201, 1387, 952)).resize((630, 355), Image.Resampling.LANCZOS)
    output.paste(shot, (x, y + 32))
draw.text((20, 842), 'ภาพจากต้นแบบที่เปิดเล่นได้จริง · ยังเป็นขั้นตรวจทิศทางภาพก่อนสร้างเนื้อหาเต็มตอน', font=small, fill='#9bb0b3')
output.save(root / 'evidence' / 'scene-review.png')
