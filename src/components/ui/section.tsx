import type { FC, HTMLAttributes, RefObject } from 'react';

import { Layout } from '@/constants/vars';
import { cn } from '@/utils/cn';

type Props = HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement | null>;
};

const Section: FC<Props> & { Content: FC<Props> } = ({ children, ref, className, ...props }) => {
    return (
        <section ref={ref} className={cn(className)} {...props}>
            {children}
        </section>
    );
};

const SectionContent: FC<Props> = ({ children, ref, className, style, ...props }) => {
    return (
        <div
            ref={ref}
            className={cn('grid', className)}
            style={{
                gridTemplateColumns: `repeat(${Layout.GRID_COLUMNS}, 1fr)`,
                columnGap: Layout.GRID_GAP,
                ...style,
            }}
            {...props}
        >
            {children}
        </div>
    );
};

Section.Content = SectionContent;
Section.displayName = 'Section';
SectionContent.displayName = 'SectionContent';

export default Section;
