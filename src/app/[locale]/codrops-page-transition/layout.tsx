import '@/modules/pages/CodropsPageTransition/codrops.css';

import TransitionLayout from '@/modules/pages/CodropsPageTransition/TransitionLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <TransitionLayout>{children}</TransitionLayout>;
}
