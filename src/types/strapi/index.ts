export type StrapiPagination = {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
};

export type StrapiMeta = {
    pagination: StrapiPagination;
};

export type StrapiData<T> = {
    data: T;
    meta: StrapiMeta;
};

export type StrapiImage = {
    url?: string;
    alternativeText?: string;
    width?: number;
    height?: number;
    mime?: string;
};

export type StrapiOpenGraph = {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: StrapiImage;
    ogUrl?: string;
    ogType?: string;
};

export type StrapiSEO = {
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: StrapiImage;
    openGraph?: StrapiOpenGraph;
    keywords?: string;
    metaRobots?: string;
    metaViewport?: string;
    canonicalURL?: string;
    structuredData?: string;
};

export type StrapiShareContent = {
    content: string;
    hashtags?: string; // example: #hashtag1#hashtag2#hashtag3
};
