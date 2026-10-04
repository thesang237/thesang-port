// Screenshots each project's main route into public/all/<id>.webp (see NOTES.md).
// node src/modules/pages/AllPages/capture-thumbs.mjs [id ...] [--wait=ms]
// Needs the dev server on :3000, Playwright (from .clone-analysis/tools) and `cwebp` (brew install webp).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const { chromium } = await import(`${ROOT}/.clone-analysis/tools/node_modules/playwright/index.mjs`);
const OUT = `${ROOT}/public/all`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'all-thumbs-')) + '/';
fs.mkdirSync(OUT, { recursive: true });

const src = fs.readFileSync(`${ROOT}/src/modules/pages/AllPages/data.ts`, 'utf8');
let jobs = [...src.slice(src.indexOf('export const PROJECTS')).matchAll(/id: '([^']+)',[\s\S]*?route: '([^']+)'/g)].map((m) => ({ id: m[1], route: m[2] }));
jobs = jobs.filter((j) => !new RegExp(`id: '${j.id}'[^}]*noThumb: true`).test(src)); // these use a typographic cover
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (only.length) jobs = jobs.filter((j) => only.includes(j.id));

// extra settle time for pages with loaders or heavy scenes
const WAIT = { truus: 12000, corn: 14000, kpr: 9000, landonorris: 9000, 'aim-obys': 8000, igloo: 10000, floema: 7000, 'shoe-finder': 7000, '3d-map': 8000 };
const flags = Object.fromEntries(process.argv.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await ctx.route('**/react-scan/**', (r) => r.abort());
// zoom into small centred demos so they read at card size
const CLIP = {
    'jhey-dynamic-toggle': { x: 360, y: 225, width: 720, height: 450 },
    'jhey-hover-disclosures': { x: 240, y: 280, width: 960, height: 600 },
    'jhey-context-aware': { x: 300, y: 184, width: 840, height: 525 },
    'jhey-frosted-border': { x: 240, y: 150, width: 960, height: 600 },
};
const ACT = {
    kpr: async (p) => {
        await p.getByText('Enter without sound').click();
        await p.waitForTimeout(6000);
    },
    'jhey-sticky-scroll': async (p) => {
        await p.emulateMedia({ colorScheme: 'dark' });
        await p.waitForTimeout(3000);
    },
    'jhey-svg-slider': async (p) => {
        await p.addStyleTag({ content: '[class*=slider_slider]{opacity:1!important}' });
        await p.mouse.move(600, 450);
        await p.mouse.move(760, 450, { steps: 10 });
        await p.waitForTimeout(800);
    },
};
for (const { id, route } of jobs) {
    const page = await ctx.newPage();
    const url = `http://localhost:3000/en${route === '/' ? '' : route}`;
    try {
        await page.goto(url, { waitUntil: 'load', timeout: 90000 });
        await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' }).catch(() => {});
        await page.waitForTimeout(+(flags.wait ?? WAIT[id] ?? 5000));
        if (ACT[id]) await ACT[id](page);
        if (flags.scroll) {
            await page.mouse.wheel(0, +flags.scroll);
            await page.waitForTimeout(2500);
        }
        const png = `${TMP}${id}.png`;
        await page.screenshot({ path: png, clip: CLIP[id] });
        execFileSync('cwebp', ['-quiet', '-q', '74', '-resize', '960', '0', png, '-o', `${OUT}/${id}.webp`]);
        console.log('ok', id);
    } catch (e) {
        console.log('FAIL', id, e.message.split('\n')[0]);
    }
    await page.close();
}
await browser.close();
