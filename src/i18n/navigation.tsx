import type { AnchorHTMLAttributes } from 'react';
import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
const { Link: I18nLink, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export { getPathname, redirect, usePathname, useRouter };

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href?: string;
};

export const Link = ({ children, href, ...props }: LinkProps) => {
    return (
        <I18nLink passHref href={href ?? '#'}>
            <span {...props}>{children}</span>
        </I18nLink>
    );
};
