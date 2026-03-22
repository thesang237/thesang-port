'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
    { label: 'Tower', slug: 'tower' },
    { label: 'Paper', slug: 'paper' },
    { label: 'Spiral', slug: 'spiral' },
] as const;

export default function KineticNav() {
    const pathname = usePathname();
    const base = pathname?.replace(/\/r3f-kinetic\/\w+$/, '') ?? '';

    return (
        <nav className="pointer-events-auto fixed top-6 left-6 z-50 flex flex-col gap-2">
            {LINKS.map(({ label, slug }) => {
                const href = `${base}/r3f-kinetic/${slug}`;
                const active = pathname?.endsWith(`/r3f-kinetic/${slug}`);
                return (
                    <Link key={slug} href={href} className={`text-sm uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}>
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
