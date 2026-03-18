import { ClientVars } from '@/constants/client-only';
import { copyToClipboard } from '@/utils/app';

export type SocialPlatform = 'facebook' | 'twitter' | 'linkedin' | 'telegram' | 'whatsapp' | 'copy';

export type ShareData = {
    description?: string;
    hashtags?: string[];
};

export const getSocialShareUrl = (platform: SocialPlatform, data: ShareData = {}): string => {
    const url = ClientVars.APP_DOMAIN;

    const { description = '', hashtags = [] } = data;
    const processedDescription = description.replaceAll('{{link}}', url);

    // Encode parts individually
    const encodedUrl = encodeURIComponent(url);
    const encodedDescription = encodeURIComponent(processedDescription);
    // const encodedHashtags = encodeURIComponent(hashtags.join(','));

    switch (platform) {
        case 'facebook': {
            const params = new URLSearchParams({
                u: url,
                quote: encodedDescription,
            });
            return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
        }

        case 'twitter': {
            const params = new URLSearchParams({
                text: `${encodedDescription} ${encodedUrl}`,
            });
            if (hashtags?.length) params.set('hashtags', hashtags.join(','));
            return `https://twitter.com/intent/tweet?${params.toString()}`;
        }

        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

        case 'telegram': {
            const params = new URLSearchParams({
                url,
                text: `${encodedDescription}\n\n${encodedUrl}`,
            });
            return `https://t.me/share/url?${params.toString()}`;
        }

        case 'whatsapp': {
            const text = `${encodedDescription}\n\n${encodedUrl}`;
            return `https://wa.me/?text=${encodeURIComponent(text)}`;
        }

        case 'copy':
        default:
            return url;
    }
};

export const shareToSocial = (platform: SocialPlatform, data: ShareData = {}): void => {
    if (platform === 'copy') {
        copyToClipboard(ClientVars.APP_DOMAIN);
        return;
    }

    const shareUrl = getSocialShareUrl(platform, data);
    window.open(shareUrl, '_blank', 'width=600,height=400');
};
