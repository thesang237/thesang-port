export const anchorFields = `
  label
  link
`;

export const imageFields = `
  url
  alternativeText
  width
  height
  mime
`;

export const seoFields = `
  metaTitle
  metaDescription
  metaImage {
    ${imageFields}
  }
  openGraph {
    ogTitle
    ogDescription
    ogImage {
      ${imageFields}
    }
    ogUrl
    ogType
  }
  keywords
  metaRobots
  metaViewport
  canonicalURL
  structuredData
`;
