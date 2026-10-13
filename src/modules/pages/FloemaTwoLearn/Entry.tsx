'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
const Guide = dynamic(() => import('./Guide'), {
    ssr: false,
    loading: () => (
        <main className="f2-learn f2l-loading">
            <span className="f2l-eyebrow">FLOEMA / FIELD NOTES 02</span>
            <h1>Inside the experience.</h1>
            <p>Preparing the interactive guide…</p>
        </main>
    ),
});
export default function LearnEntry() {
    return (
        <>
            <Guide />
            <noscript>
                <p>
                    This interactive guide needs JavaScript. You can still explore <Link href="/floema-2/home">the homepage</Link> and <Link href="/floema-2/sustainability">sustainability page</Link>.
                </p>
            </noscript>
        </>
    );
}
