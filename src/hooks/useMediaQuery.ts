'use client';

import { useEffect, useState } from 'react';

const useMediaQuery = (query: string, fallback = false): boolean => {
    const [matches, setMatches] = useState(fallback);

    useEffect(() => {
        const mql = window.matchMedia(query);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMatches(mql.matches);

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

export default useMediaQuery;
