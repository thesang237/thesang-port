'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { FORCE_DELAY_ENTERED_IN_MS } from '@/constants/animation';
import { ZIndex } from '@/constants/vars';
import { useRouter } from '@/i18n/navigation';
import { useSubscribePage } from '@/providers/page';
import usePageStore, { PageState } from '@/stores/page';

const WAVE_COLOR = '#000000';

const PageTransition = () => {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progressRef = useRef({ value: 0 });
    const tweenRef = useRef<gsap.core.Tween | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const draw = (progress: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.beginPath();

        const widthSegments = Math.ceil(w / 40);
        const t = (1 - progress) * h;
        const amplitude = 250 * Math.sin(progress * Math.PI);

        ctx.moveTo(w, h);
        ctx.lineTo(0, h);
        ctx.lineTo(0, t);

        for (let i = 0; i <= widthSegments; i++) {
            const x = 40 * i;
            const y = t - Math.sin((x / w) * Math.PI) * amplitude;
            ctx.lineTo(x, y);
        }
        // ctx.lineTo(w, t);

        ctx.fillStyle = WAVE_COLOR;
        ctx.fill();
        ctx.restore();
    };

    useSubscribePage('page-transition', {
        onChange: (pageState) => {
            if (pageState === PageState.EXITING) {
                tweenRef.current?.kill();
                progressRef.current.value = 0;

                gsap.set(canvasRef.current, {
                    rotation: 0,
                    visibility: 'visible',
                    pointerEvents: 'auto',
                });

                tweenRef.current = gsap.to(progressRef.current, {
                    value: 1,
                    duration: 1.5,
                    ease: 'expo.inOut',
                    onUpdate: () => draw(progressRef.current.value),
                    onComplete: () => {
                        router.push(usePageStore.getState().pageInfo.pathname);
                    },
                });
                return;
            }

            if (pageState === PageState.EXITED) {
                tweenRef.current?.kill();
                progressRef.current.value = 1;

                gsap.set(canvasRef.current, { rotation: 180 });

                tweenRef.current = gsap.to(progressRef.current, {
                    value: 0,
                    duration: 1.5,
                    ease: 'expo.inOut',
                    onUpdate: () => draw(progressRef.current.value),
                    onComplete: () => {
                        gsap.set(canvasRef.current, {
                            visibility: 'hidden',
                            pointerEvents: 'none',
                        });

                        setTimeout(() => {
                            usePageStore.getState().actions.setState({
                                pageState: PageState.ENTERED,
                            });
                        }, FORCE_DELAY_ENTERED_IN_MS);
                    },
                });
            }
        },
    });

    // 🔧 DEV ONLY — remove before commit
    // useEffect(() => {
    //     gsap.set(canvasRef.current, { visibility: 'visible', pointerEvents: 'none' });
    //     // Loop the animation so you can watch it repeatedly
    //     const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
    //     tl.fromTo(
    //         progressRef.current,
    //         { value: 0 },
    //         {
    //             value: 1,
    //             duration: 1.5,
    //             ease: 'expo.inOut',
    //             onUpdate: () => draw(progressRef.current.value),
    //         },
    //     );
    //     tl.set(canvasRef.current, { rotation: 180 });
    //     tl.fromTo(
    //         progressRef.current,
    //         { value: 1 },
    //         {
    //             value: 0,
    //             duration: 1.5,
    //             ease: 'expo.inOut',
    //             onUpdate: () => draw(progressRef.current.value),
    //         },
    //     );
    //     tl.set(canvasRef.current, { rotation: 0 });
    //     return () => {
    //         tl.kill();
    //     };
    // }, []);
    // 🔧 DEV ONLY — remove before commit
    useEffect(() => {
        gsap.set(canvasRef.current, { visibility: 'visible', pointerEvents: 'none' });
        const slider = document.createElement('input');
        Object.assign(slider.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '300px',
            zIndex: '999999',
        });
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = '0';
        slider.oninput = () => {
            draw(Number(slider.value) / 100);
        };
        document.body.appendChild(slider);
        return () => slider.remove();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: ZIndex.LOADER,
                width: '100vw',
                height: '100vh',
                visibility: 'hidden',
                pointerEvents: 'none',
            }}
        />
    );
};

export default PageTransition;
