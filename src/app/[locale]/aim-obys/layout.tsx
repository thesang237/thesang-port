import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

// KH Teka (trial cut, as used by the reference) — replace with a licensed copy before publishing
const teka = localFont({
    src: [
        { path: '../../../modules/pages/AimObys/fonts/KHTeka-Regular.otf', weight: '400', style: 'normal' },
        { path: '../../../modules/pages/AimObys/fonts/KHTeka-Medium.otf', weight: '500', style: 'normal' },
    ],
    variable: '--aim-font',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'AIM— AI Modernism Of Kharkiv',
    description: 'Motion study: lottie logo loader, scroll-scrubbed logo break-up, pinned photo story and footer logo build.',
};

export default function AimObysLayout({ children }: { children: ReactNode }) {
    return <div className={teka.variable}>{children}</div>;
}
