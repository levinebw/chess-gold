import { chromium } from '@playwright/test';

const SITE = 'https://levinebw.github.io/chess-gold/';
const SHOTS = 'test/reports/screenshots/live-';

async function clickSquare(page: any, square: string) {
  const board = page.locator('.board-container cg-board');
  const box = await board.boundingBox();
  if (!box) throw new Error('Board not found');
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  const x = box.x + (file + 0.5) * (box.width / 8);
  const y = box.y + (7 - rank + 0.5) * (box.height / 8);
  await page.mouse.click(x, y);
}

async function movePiece(page: any, from: string, to: string) {
  await clickSquare(page, from);
  await page.waitForTimeout(150);
  await clickSquare(page, to);
  await page.waitForTimeout(200);
}

async function shot(page: any, name: string, label: string) {
  const path = `${SHOTS}${name}.png`;
  await page.screenshot({ path });
  console.log(`  [screenshot] ${label} -> ${path}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log('=== Live Playtest at', SITE, '===\n');
  await page.goto(SITE);
  await page.waitForSelector('.board-container cg-board', { timeout: 15000 });
  console.log('Page loaded.');

  // --- Screenshot 1: Initial state ---
  await shot(page, '01-initial', 'Initial state: two kings, 3g each');

  // --- Move 1: White Ke1-d1 ---
  await movePiece(page, 'e1', 'd1');
  console.log('W1: Ke1-d1');
  await shot(page, '02-w1-move', 'After W1: Ke1-d1, last-move highlight visible');

  // --- Move 2: Black Ke8-d8 ---
  await movePiece(page, 'e8', 'd8');
  console.log('B1: Ke8-d8');
  await shot(page, '03-b1-move', 'After B1: Ke8-d8');

  // --- Move 3: White places pawn on a2 ---
  await page.click('.shop-piece:has(.piece-label:text("Pawn"))');
  await page.waitForTimeout(300);
  await shot(page, '04-placement-mode', 'Placement mode active — green circles for valid squares');
  await clickSquare(page, 'a2');
  await page.waitForTimeout(300);
  console.log('W2: Place pawn a2');
  await shot(page, '05-w2-pawn-placed', 'After W2: Pawn placed on a2');

  // --- Move 4: Black Kd8-c8 ---
  await movePiece(page, 'd8', 'c8');
  console.log('B2: Kd8-c8');

  // --- Moves 5-8: Save gold ---
  await movePiece(page, 'd1', 'c1');  console.log('W3: Kd1-c1');
  await movePiece(page, 'c8', 'b8');  console.log('B3: Kc8-b8');
  await movePiece(page, 'c1', 'b1');  console.log('W4: Kc1-b1');
  await movePiece(page, 'b8', 'a8');  console.log('B4: Kb8-a8');

  // --- White places knight ---
  await page.click('.shop-piece:has(.piece-label:text("Knight"))');
  await page.waitForTimeout(300);
  await clickSquare(page, 'c1');
  await page.waitForTimeout(300);
  console.log('W5: Place knight c1');
  await shot(page, '06-w5-knight-placed', 'After W5: Knight on c1, pawn on a2');

  // --- Continue play ---
  await movePiece(page, 'a8', 'b8');  console.log('B5: Ka8-b8');
  await movePiece(page, 'a2', 'a3');  console.log('W6: a2-a3 (pawn push)');
  await movePiece(page, 'b8', 'c8');  console.log('B6: Kb8-c8');
  await movePiece(page, 'a3', 'a4');  console.log('W7: a3-a4');
  await movePiece(page, 'c8', 'd8');  console.log('B7: Kc8-d8');

  await shot(page, '07-mid-game', 'Mid-game: pieces developing, gold accumulating');

  // --- White places rook (should have enough gold now) ---
  const rookBtn = page.locator('.shop-piece:has(.piece-label:text("Rook"))');
  if (await rookBtn.isEnabled()) {
    await rookBtn.click();
    await page.waitForTimeout(300);
    await clickSquare(page, 'a1');
    await page.waitForTimeout(300);
    console.log('W8: Place rook a1');
    await shot(page, '08-w8-rook-placed', 'After W8: Rook on a1');

    // Black moves
    await movePiece(page, 'd8', 'e8');  console.log('B8: Kd8-e8');

    // Push pawn further
    await movePiece(page, 'a4', 'a5');  console.log('W9: a4-a5');
    await movePiece(page, 'e8', 'f8');  console.log('B9: Ke8-f8');

    // Rook controls a-file, try to deliver check
    await movePiece(page, 'a1', 'a8');  console.log('W10: Ra1-a8+ (check!)');
    await shot(page, '09-check', 'Check! Ra8 checks black king — red glow on king');

    // Black escapes
    await movePiece(page, 'f8', 'g7');  console.log('B10: Kf8-g7');
    await shot(page, '10-after-check', 'After check escape: Kg7');
  } else {
    console.log('Rook not yet affordable, continuing with what we have...');
    await movePiece(page, 'a4', 'a5');  console.log('W8: a4-a5');
    await movePiece(page, 'd8', 'e7');  console.log('B8: Kd8-e7');
    await shot(page, '08-continued', 'Game continues');
  }

  // --- Open rules dialog ---
  await page.click('.rules-button');
  await page.waitForTimeout(300);
  await shot(page, '11-rules-dialog', 'Rules dialog open on live site');
  await page.click('.rules-close-button');
  await page.waitForTimeout(200);

  // --- Final state screenshot ---
  await shot(page, '12-final-state', 'Final game state before closing');

  // --- Mobile viewport test ---
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(300);
  await shot(page, '13-mobile-view', 'Mobile viewport (375x667)');

  console.log('\n=== Playtest complete ===');
  await browser.close();
})();
