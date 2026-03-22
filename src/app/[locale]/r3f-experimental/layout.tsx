import type { FC, ReactNode } from 'react';

import Overlay from '@/modules/pages/R3fExperimental/components/Overlay';
import R3fExperimentalLenis from '@/modules/pages/R3fExperimental/LenisProvider';

type Props = {
    children: ReactNode;
};

const Layout: FC<Props> = ({ children }) => {
    return (
        <R3fExperimentalLenis>
            <Overlay />
            {children}
        </R3fExperimentalLenis>
    );
};

export default Layout;
