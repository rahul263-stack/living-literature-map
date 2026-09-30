import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'screenshots');

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 4000)); // wait for animations

// 1. Hero / Full page top
await page.screenshot({ path: join(OUT, '01_hero.png'), fullPage: false });
console.log('✓ 01_hero.png');

// Scroll helper
async function scrollToAndCapture(selector, filename, extraWait = 1500) {
  try {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, selector);
    await new Promise(r => setTimeout(r, extraWait));
    await page.screenshot({ path: join(OUT, filename), fullPage: false });
    console.log(`✓ ${filename}`);
  } catch (e) {
    console.log(`✗ ${filename}: ${e.message}`);
  }
}

// 2. Schools of Thought
await scrollToAndCapture('#schools', '02_schools.png', 2000);

// 3. Research Gap
await scrollToAndCapture('#gap', '03_gap.png', 2000);

// 4. Evidence Table
await scrollToAndCapture('#evidence', '04_evidence.png', 2000);

// 5. Bridge Papers
await scrollToAndCapture('#bridge', '05_bridge.png', 2000);

// 6. Cluster / 3D
await scrollToAndCapture('#cluster', '06_cluster.png', 2000);

// 7. PRISMA
await scrollToAndCapture('#prisma', '07_prisma.png', 2000);

// 8. Writing Desk
await scrollToAndCapture('#writing', '08_writing.png', 2000);

// 9. Debate
await scrollToAndCapture('#debate', '09_debate.png', 2000);

// 10. Journal
await scrollToAndCapture('#journal', '10_journal.png', 2000);

// 11. Upload
await scrollToAndCapture('#upload', '11_upload.png', 2000);

// 12. Download
await scrollToAndCapture('#download', '12_download.png', 2000);

await browser.close();
console.log('\nDone! All screenshots saved to:', OUT);
