'use client';

import dynamic from 'next/dynamic';

// client only: the seed comes from the URL / localStorage / crypto, and the art draws into a canvas
const ArtSolacePage = dynamic(() => import('@/modules/pages/ArtSolace/ArtSolacePage'), { ssr: false });

export default function ArtSolace() {
    return <ArtSolacePage />;
}
