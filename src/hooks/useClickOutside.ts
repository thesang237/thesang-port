import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';

type Props = {
    ref?: RefObject<Element | null>;
    onClickOutside?: () => void;
};

const useClickOutside = ({ ref, onClickOutside }: Props) => {
    const callbackRef = useRef(onClickOutside);

    // Update the ref when callback changes
    useEffect(() => {
        callbackRef.current = onClickOutside;
    }, [onClickOutside]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref?.current && !ref.current.contains(e.target as Node)) {
                callbackRef.current?.();
            }
        };

        document.addEventListener('mousedown', handler);

        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }, []);
};

export default useClickOutside;
