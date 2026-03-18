'use client';

import gsap from 'gsap';

import useBoxMotionBase from '@/components/animation/Box/hooks/useBoxMotionBase';
import { FORCE_DELAY_ENTERED_IN_MS } from '@/constants/animation';
import { ZIndex } from '@/constants/vars';
import { useRouter } from '@/i18n/navigation';
import { useSubscribePage } from '@/providers/page';
import usePageStore, { PageState } from '@/stores/page';

const PageTransition = () => {
    const router = useRouter();

    const { animateIn, animateOut, ref } = useBoxMotionBase();

    useSubscribePage('page-transition', {
        onChange: (pageState) => {
            if (pageState === PageState.EXITING) {
                animateIn({
                    inVars: {
                        duration: 0.6,
                        ease: 'power3.out',
                        opacity: 1,
                        onStart: () => {
                            gsap.set(ref.current, {
                                visibility: 'visible',
                                pointerEvents: 'auto',
                            });
                        },
                        onComplete: () => {
                            router.push(usePageStore.getState().pageInfo.pathname);
                        },
                    },
                });
                return;
            }

            if (pageState === PageState.EXITED) {
                animateOut({
                    outVars: {
                        duration: 0.6,
                        ease: 'power3.out',
                        opacity: 0,
                        onComplete: () => {
                            gsap.set(ref.current, {
                                visibility: 'hidden',
                                pointerEvents: 'none',
                            });

                            setTimeout(() => {
                                usePageStore.getState().actions.setState({
                                    pageState: PageState.ENTERED,
                                });
                            }, FORCE_DELAY_ENTERED_IN_MS);
                        },
                    },
                });
            }
        },
    });

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: ZIndex.LOADER,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0,
                willChange: 'opacity',
                visibility: 'hidden',
                pointerEvents: 'none',
                backgroundColor: 'black',
            }}
        />
    );
};

export default PageTransition;
