'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const EXPERIMENTS = [1, 2, 3, 4, 5, 6] as const;

const Overlay = () => {
    const pathname = usePathname();

    const getExperimentPath = (num: number) => {
        const base = pathname?.replace(/\/r3f-experimental\/\d+$/, '') || '';
        return `${base}/r3f-experimental/${num}`;
    };

    const currentExperiment = pathname?.match(/\/r3f-experimental\/(\d+)$/)?.[1];

    return (
        <div className="overlay pointer-events-none fixed inset-0 z-10 flex flex-col justify-between gap-4 p-8">
            <div className="z-5 absolute top-0 right-0 left-0 h-40 bg-linear-to-b from-[#f8f8f8] to-transparent"></div>
            <div className="z-5 absolute right-0 bottom-0 left-0 h-40 bg-linear-to-t from-[#f8f8f8] to-transparent"></div>
            <div className="z-5 absolute bottom-0 left-0 top-0 w-40 bg-linear-to-r from-[#f8f8f8] to-transparent"></div>
            <div className="z-5 absolute right-0 bottom-0 top-0 w-40 bg-linear-to-l from-[#f8f8f8] to-transparent"></div>

            <div className="z-10 flex w-full justify-between">
                <div>
                    <h1 className="font-bold italic tracking-tighter">R3F EXPERIMENTAL CAROUSEL</h1>
                    <div className="pointer-events-auto flex items-center gap-3">
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

                <nav className="pointer-events-auto z-10 flex flex-col items-end gap-2 text-sm">
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

            <div className="pointer-events-auto z-10 flex flex-wrap gap-5 uppercase tracking-tighter">
                {EXPERIMENTS.map((num) => (
                    <Link key={num} href={getExperimentPath(num)} className={currentExperiment === String(num) ? 'text-neutral-900' : 'text-neutral-500'}>
                        Experiment {num}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Overlay;
