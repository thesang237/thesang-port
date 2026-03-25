import '@/modules/pages/Floema/floema.css';

import FloemaLayout from '@/modules/pages/Floema/FloemaLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <FloemaLayout>{children}</FloemaLayout>;
}
