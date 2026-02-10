import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'article';
  noIndex?: boolean;
  structuredData?: Record<string, any>;
  movieData?: {
    name: string;
    description?: string;
    image?: string;
    datePublished?: string;
    duration?: string;
    genre?: string[];
    director?: string;
    actor?: string[];
    aggregateRating?: {
      ratingValue: number;
      ratingCount: number;
    };
  };
  tvShowData?: {
    name: string;
    description?: string;
    image?: string;
    datePublished?: string;
    numberOfSeasons?: number;
    numberOfEpisodes?: number;
    genre?: string[];
    actor?: string[];
    aggregateRating?: {
      ratingValue: number;
      ratingCount: number;
    };
  };
}

const SITE_NAME = 'CStream';
const SITE_URL = 'https://cstream.app';
const DEFAULT_IMAGE = '/android-chrome-512x512.png';
const DEFAULT_DESCRIPTION = 'CStream - La meilleure plateforme de streaming gratuit pour regarder films, séries TV et animes en HD. Catalogue complet avec nouveautés quotidiennes, VOSTFR et VF disponibles.';

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = 'streaming, films, séries, anime, gratuit, HD, VOSTFR, VF, regarder en ligne, nouveautés, CStream',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  structuredData,
  movieData,
  tvShowData,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Films, Séries & Anime en Streaming Gratuit`;
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  const generateMovieSchema = () => {
    if (!movieData) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: movieData.name,
      description: movieData.description,
      image: movieData.image,
      datePublished: movieData.datePublished,
      duration: movieData.duration,
      genre: movieData.genre,
      director: movieData.director ? {
        '@type': 'Person',
        name: movieData.director,
      } : undefined,
      actor: movieData.actor?.map(name => ({
        '@type': 'Person',
        name,
      })),
      aggregateRating: movieData.aggregateRating ? {
        '@type': 'AggregateRating',
        ratingValue: movieData.aggregateRating.ratingValue,
        bestRating: 10,
        worstRating: 0,
        ratingCount: movieData.aggregateRating.ratingCount,
      } : undefined,
    };
  };

  const generateTVShowSchema = () => {
    if (!tvShowData) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: tvShowData.name,
      description: tvShowData.description,
      image: tvShowData.image,
      datePublished: tvShowData.datePublished,
      numberOfSeasons: tvShowData.numberOfSeasons,
      numberOfEpisodes: tvShowData.numberOfEpisodes,
      genre: tvShowData.genre,
      actor: tvShowData.actor?.map(name => ({
        '@type': 'Person',
        name,
      })),
      aggregateRating: tvShowData.aggregateRating ? {
        '@type': 'AggregateRating',
        ratingValue: tvShowData.aggregateRating.ratingValue,
        bestRating: 10,
        worstRating: 0,
        ratingCount: tvShowData.aggregateRating.ratingCount,
      } : undefined,
    };
  };

  const schema = movieData ? generateMovieSchema() : tvShowData ? generateTVShowSchema() : structuredData;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      <link rel="canonical" href={fullUrl} />
      
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={title || SITE_NAME} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_FR" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content="@cstream" />
      
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export const BreadcrumbSchema = ({ items }: { items: { name: string; url: string }[] }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://cstream.app${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
