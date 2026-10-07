'use client';
import dynamic from 'next/dynamic';
const Artwork = dynamic(() => import('@/modules/pages/ArtCantera/ArtCanteraPage').then((module) => module.ArtCanteraPage), { ssr: false });
export default function Page() {
    return <Artwork />;
}
