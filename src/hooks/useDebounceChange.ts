import { useRef } from 'react';

type Props = {
    onChange: (value: string) => void;
    delay?: number;
};

const useDebounceChange = ({ onChange, delay = 500 }: Props) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedChange = (value: string) => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            onChange(value);
        }, delay);
    };

    return {
        debouncedChange,
    };
};

export default useDebounceChange;
