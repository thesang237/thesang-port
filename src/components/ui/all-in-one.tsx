import type { FC, HTMLAttributes, RefObject } from 'react';

import { cn } from '@/utils/cn';

type Props = HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement | null>;
};

const AllInOne: FC<Props> = ({ ref, children, className, ...props }) => {
    return (
        <div ref={ref} className={cn('grid [grid-template-columns:1fr] [grid-template-rows:1fr] place-items-center place-content-center [&>*]:[grid-area:1/1]', className)} {...props}>
            {children}
        </div>
    );
};

AllInOne.displayName = 'AllInOne';

export default AllInOne;
