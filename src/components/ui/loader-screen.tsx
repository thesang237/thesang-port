import type { FC } from 'react';
import { Loader } from 'lucide-react';

import { Animations } from '@/constants/vars';

type Props = {
    message?: string;
};

const LoaderScreen: FC<Props> = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center w-screen h-screen">
            <Loader
                size={24}
                style={{
                    display: 'block',
                    margin: '0 auto',
                    animation: Animations.SPIN,
                }}
            />

            <p>{message}</p>
        </div>
    );
};

export default LoaderScreen;
