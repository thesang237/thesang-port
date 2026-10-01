import type { Metadata } from 'next';

import OnTrackPage from '@/modules/pages/LandoNorris/pages/OnTrackPage';

export const metadata: Metadata = { title: 'On Track — Ellis Morrow' };

export default function LandoOnTrackRoute() {
    return <OnTrackPage />;
}
