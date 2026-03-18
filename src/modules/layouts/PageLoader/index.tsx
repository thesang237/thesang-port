'use client';

import gsap from 'gsap';

import useBoxMotionBase from '@/components/animation/Box/hooks/useBoxMotionBase';
import { FORCE_DELAY_ENTERED_IN_MS } from '@/constants/animation';
import { ZIndex } from '@/constants/vars';
import { useSubscribePage } from '@/providers/page';
import usePageStore, { PageState } from '@/stores/page';

const PageLoader = () => {
    const { animateOut, ref } = useBoxMotionBase();

    useSubscribePage('page-loader', {
        onChange: (pageState) => {
            if (pageState === PageState.ENTERING) {
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

                return;
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
                willChange: 'opacity',
                backgroundColor: 'black',
            }}
        />
    );
};

export default PageLoader;
