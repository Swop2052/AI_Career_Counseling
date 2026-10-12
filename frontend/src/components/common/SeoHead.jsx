import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'SkillSense';
const BASE_URL = 'https://skillsense.aisense.co.in';
const DEFAULT_OG_IMAGE = `${BASE_URL}/SkillSense.png`;

const DEFAULT_TITLE = 'SkillSense: Free AI Career Test & Guidance for Students';
const DEFAULT_DESCRIPTION =
  "Take SkillSense's free AI career test to discover your ideal career path. Personality-based assessment, aptitude insights, and a custom roadmap.";

export default function SeoHead({
  title,
  description,
  path = '/',
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  structuredData = null,
  exactTitle = false,
}) {
  let resolvedTitle = DEFAULT_TITLE;
  if (title) {
    if (exactTitle || title.includes(SITE_NAME)) {
      resolvedTitle = title;
    } else {
      resolvedTitle = `${title} | ${SITE_NAME}`;
    }
  }

  const resolvedDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {typeof structuredData === 'string'
            ? structuredData
            : JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
