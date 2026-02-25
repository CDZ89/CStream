import { useEffect } from "react";
import { useI18n } from '@/lib/i18n';

const NotFound = () => {
  const { t } = useI18n();

  useEffect(() => {
    // Determine the path safely, whether inside or outside Router context
    const path = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    console.error("404 Error: User attempted to access non-existent route:", path);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t('error.pageNotFound')}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t('error.returnHome')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
