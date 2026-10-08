'use client';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const FloemaExperience = dynamic(() => import('@/modules/pages/Floema/FloemaExperience'));

/** The guide uses document scrolling; the experience owns its full-screen stage. */
export default function FloemaRouteBoundary({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    return pathname.endsWith('/floema/learn') ? children : <FloemaExperience />;
}
