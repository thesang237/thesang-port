'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import type { ImageProps } from 'next/image';

import QualityImage from '@/components/ui/quality-image';
import { useAsset } from '@/providers/asset';

const PreloadImage: FC<ImageProps> = ({ ...props }) => {
    const { loadAsset, completeAsset } = useAsset();

    useEffect(() => {
        loadAsset();
    }, []);

    return <QualityImage loading="eager" fetchPriority="high" {...props} onLoad={completeAsset} onError={completeAsset} />;
};

export default PreloadImage;
