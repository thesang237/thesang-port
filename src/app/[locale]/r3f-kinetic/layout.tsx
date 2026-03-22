import type { ReactNode } from 'react';

import KineticNav from '@/modules/pages/R3fKinetic/components/KineticNav';

export default function R3fKineticLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <KineticNav />
            {children}
        </>
    );
}
