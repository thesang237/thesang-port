'use client';

export const isClient = typeof window !== 'undefined';

export const download = async (objectUrl: string) => {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = objectUrl;
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
};
