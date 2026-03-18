import { isClient } from '@/utils/client-only';
import { mapRange } from '@/utils/math';

export const getScroll = (): number => {
    return window.scrollY || document.documentElement.scrollTop || 0;
};

export const checkIsInView = (element: DomLike | null): boolean => {
    if (!element || !isClient) return false;

    const rect = element.getBoundingClientRect();
    const scrollTop = getScroll();
    return rect.top <= window.innerHeight && rect.top >= 0 && Math.abs(scrollTop) < 0;
};

type CalcThresholdParams = {
    element: DomLike | null;
    threshold?: number;
};
export const calcThreshold = ({ element, threshold }: CalcThresholdParams): number => {
    if (!isClient || !element) return 0;

    let inputThreshold = threshold ?? 0;

    if (inputThreshold === 0 && element instanceof HTMLElement) {
        const { height, top } = element.getBoundingClientRect();

        if (top >= window.innerHeight) {
            inputThreshold = mapRange({
                value: height / window.innerHeight,
                inMin: 0,
                inMax: 100,
                outMin: 30,
                outMax: 0,
            });

            inputThreshold = Math.max(Math.min(inputThreshold, 30), 0);
        }
    }
    return inputThreshold;
};
