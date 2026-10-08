import { content, type View } from './data';
import { clamp, mix, wrap } from './motion';

export type Rect = { x: number; y: number; width: number; height: number };
export type GalleryLayout = { top: number; images: number; offset: number; target: number; direction: number };
export function createScene() {
    return {
        view: 'home' as View,
        width: 1440,
        height: 900,
        unit: 7.5,
        worldHeight: 2 * Math.tan(Math.PI / 8) * 5,
        ready: false,
        reduced: false,
        time: 0,
        home: { current: 0, target: 0, title: 0, titleTarget: 0, direction: 1, speed: 0 },
        collection: { current: 0, target: 0, active: 0, selected: -1, expansion: 0, visibility: 1, detail: { x: 0, y: 0, width: 0, height: 0 } as Rect, detailScroll: 0 },
        about: { current: 0, target: 0, limit: 0, galleries: [] as GalleryLayout[] },
    };
}
export type SceneState = ReturnType<typeof createScene>;
export const collectionStep = (scene: SceneState) => 46.36 * scene.unit;
export const collectionLimit = (scene: SceneState) => (content.products.length - 1) * collectionStep(scene);
export const collectionIndex = (scene: SceneState) =>
    clamp(Math.floor(((Math.abs(scene.collection.current) + 17.88 * scene.unit) / collectionLimit(scene)) * (content.products.length - 1)), 0, content.products.length - 1);
export function cardPose(scene: SceneState, index: number) {
    const { unit, width, height, worldHeight, time, collection: c } = scene;
    const ratio = height / worldHeight;
    const left = width / 2 - 22.35 * unit + index * collectionStep(scene);
    const original = (left + 17.88 * unit - width / 2) / ratio;
    const float = scene.reduced ? 0 : Math.sin((original / 10) * Math.PI * 2 + (time * 60) / 500) * 0.5;
    const progress = c.selected === index ? c.expansion : 0;
    const x = mix(left + c.current, c.detail.x, progress);
    const w = mix(35.76 * unit, c.detail.width, progress);
    const h = mix(50.48 * unit, c.detail.height, progress);
    const centerX = (x + w / 2 - width / 2) / ratio;
    const worldWidth = width / ratio;
    return {
        x,
        y: mix(height / 2 - h / 2 - float * ratio, c.detail.y - c.detailScroll, progress),
        width: w,
        height: h,
        rotation: mix((-1.2 * float * centerX) / worldWidth, Math.PI * 0.01, progress),
        flip: scene.reduced ? 0 : progress * Math.PI * 2,
        opacity: (c.selected < 0 || c.selected === index ? 1 : c.visibility) * (c.active === index ? 1 : 0.4),
    };
}
export function homeLayout(scene: SceneState) {
    const mobile = scene.width < 768;
    const gap = (mobile ? 3 : 5) * scene.unit;
    const columns = mobile ? 2 : 5;
    const cellWidth = (scene.width - gap) / columns;
    const width = cellWidth - gap;
    const photos = [...content.home, ...content.home];
    let rowTop = 0;
    const offsets = [0, 10, 30, 20, 40];
    const rects: Rect[] = [];
    for (let start = 0; start < photos.length; start += columns) {
        const row = photos.slice(start, start + columns);
        for (let column = 0; column < row.length; column++) {
            const photo = row[column];
            rects.push({ x: gap + column * cellWidth, y: rowTop + gap / 2 + (mobile ? 0 : offsets[(start + column) % 5] * scene.unit), width, height: (width * photo.height) / photo.width });
        }
        rowTop += Math.max(...row.map((photo) => (width * photo.height) / photo.width)) + gap;
    }
    return { rects, total: rowTop };
}
export function homeY(scene: SceneState, rect: Rect, total: number) {
    return wrap(rect.y + scene.home.current, scene.height - total, scene.height);
}
