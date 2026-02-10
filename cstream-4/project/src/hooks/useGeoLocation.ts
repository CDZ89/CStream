import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export const useGeoLocation = () => {
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLanguage } = useI18n();

  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const countryCode = data.country_code;
        setCountry(countryCode);

        // Auto language mapping
        const langMap: Record<string, string> = {
          'FR': 'fr', 'BE': 'fr', 'CH': 'fr', 'LU': 'fr', 'MC': 'fr', 'DZ': 'fr', 'MA': 'fr', 'TN': 'fr',
          'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en',
          'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es',
          'PT': 'pt', 'BR': 'pt',
          'DE': 'de', 'AT': 'de',
          'IT': 'it', 'KR': 'ko', 'JP': 'ja', 'RU': 'ru', 'SA': 'ar', 'AE': 'ar'
        };

        const preferredLang = langMap[countryCode];
        if (preferredLang) {
          // Check if language was already manually set
          const savedLang = localStorage.getItem('cstream_language');
          if (!savedLang) {
            setLanguage(preferredLang as any);
          }
        }
      } catch (error) {
        console.error('GeoLocation error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGeo();
  }, [setLanguage]);

  return { country, loading };
};
