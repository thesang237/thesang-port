export type CanvasAxis = 'x' | 'y';

export type GetCanvasTextureOptions = {
    axis?: CanvasAxis;
    gap?: number;
    canvasHeight?: number;
    canvasWidth?: number;
};

/**
 * Composites multiple images into a single canvas along the given axis.
 * axis='x' → images side-by-side (horizontal), scaled to canvasHeight.
 * axis='y' → images stacked vertically, scaled to canvasWidth.
 */
export async function getCanvasTexture(urls: string[], options: number | GetCanvasTextureOptions = 512): Promise<HTMLCanvasElement> {
    const normalized: GetCanvasTextureOptions = typeof options === 'number' ? { canvasHeight: options } : options;

    const { axis = 'x', gap = 0, canvasHeight = 512, canvasWidth = 512 } = normalized;

    const images = await Promise.all(
        urls.map(
            (url) =>
                new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = url;
                }),
        ),
    );

    const dims = images.map((img) => {
        const ratio = img.naturalWidth / img.naturalHeight;
        if (axis === 'x') {
            return { w: Math.round(canvasHeight * ratio), h: canvasHeight };
        } else {
            return { w: canvasWidth, h: Math.round(canvasWidth / ratio) };
        }
    });

    const totalWidth = axis === 'x' ? dims.reduce((sum, d, i) => sum + d.w + (i > 0 ? gap : 0), 0) : canvasWidth;

    const totalHeight = axis === 'y' ? dims.reduce((sum, d, i) => sum + d.h + (i > 0 ? gap : 0), 0) : canvasHeight;

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    const ctx = canvas.getContext('2d')!;
    let x = 0;
    let y = 0;

    for (let i = 0; i < images.length; i++) {
        const { w, h } = dims[i];
        ctx.drawImage(images[i], x, y, w, h);
        if (axis === 'x') x += w + gap;
        else y += h + gap;
    }

    return canvas;
}
