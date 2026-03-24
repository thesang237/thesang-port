'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/cn';

const EXPERIMENTS = [1, 2, 3, 4, 5, 6] as const;

const Overlay = () => {
    const pathname = usePathname();

    const getPath = (num?: number) => {
        const base = pathname?.replace(/\/r3f-experimental(\/\d+)?$/, '') || '';
        return num === undefined ? `${base}/r3f-experimental` : `${base}/r3f-experimental/${num}`;
    };

    const currentExperiment = pathname?.match(/\/r3f-experimental\/(\d+)$/)?.[1];
    const isMainPage = pathname?.endsWith('/r3f-experimental');

    return (
        <div className={cn('overlay pointer-events-none fixed inset-0 z-50 flex flex-col justify-between gap-4 p-8 uppercase', isMainPage ? 'text-white' : 'text-black')}>
            <div className="z-5 absolute top-0 right-0 left-0 h-40 bg-linear-to-b from-[#f8f8f8] to-transparent"></div>
            <div className="z-5 absolute right-0 bottom-0 left-0 h-40 bg-linear-to-t from-[#f8f8f8] to-transparent"></div>
            <div className="z-5 absolute bottom-0 left-0 top-0 w-40 bg-linear-to-r from-[#f8f8f8] to-transparent"></div>
            <div className="z-5 absolute right-0 bottom-0 top-0 w-40 bg-linear-to-l from-[#f8f8f8] to-transparent"></div>

            <div className={cn('z-10 flex w-full justify-between mix-blend-difference')}>
                <div>
                    <h1 className="font-bold italic tracking-tighter">R3F EXPERIMENTAL CAROUSEL</h1>
                    <div className="pointer-events-auto flex items-center gap-3 text-sm normal-case whitespace-nowrap">
                        <a target="_blank" href="https://tympanus.net/codrops/2025/11/26/creating-wavy-infinite-carousels-in-react-three-fiber-with-glsl-shaders/">
                            Article
                        </a>
                        <a target="_blank" href="https://tympanus.net/codrops/hub/">
                            All demos
                        </a>
                        <a target="_blank" href="https://github.com/colindmg/r3f-experimental-carousel">
                            GitHub
                        </a>
                    </div>
                </div>

                <nav className="pointer-events-auto z-10 flex flex-col items-end gap-2 text-sm italic normal-case">
                    <a target="_blank" href="https://tympanus.net/codrops/hub/tag/carousel/">
                        #carousel
                    </a>
                    <a target="_blank" href="https://tympanus.net/codrops/hub/tag/three-js/">
                        #three.js
                    </a>
                    <a target="_blank" href="https://tympanus.net/codrops/hub/tag/webgl/">
                        #webgl
                    </a>
                    <a target="_blank" href="https://tympanus.net/codrops/hub/tag/react-three-fiber/">
                        #r3f
                    </a>
                </nav>
            </div>

            <div className="pointer-events-auto z-10 flex flex-wrap gap-5 tracking-tighter">
                <Link href={getPath()} className={isMainPage ? 'opacity-100 font-bold' : 'opacity-40 hover:opacity-100 transition-opacity'}>
                    Index
                </Link>
                {EXPERIMENTS.map((num) => (
                    <Link key={num} href={getPath(num)} className={currentExperiment === String(num) ? 'opacity-100 font-bold' : 'opacity-40 hover:opacity-100 transition-opacity'}>
                        Exp {num}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Overlay;
