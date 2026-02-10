import { motion } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
  itemsShowing?: number;
  totalItems?: number;
}

export const LoadMoreButton = ({
  onClick,
  isLoading,
  hasMore,
  itemsShowing,
  totalItems,
}: LoadMoreButtonProps) => {
  const { t } = useI18n();
  
  if (!hasMore) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-8"
    >
      {itemsShowing && totalItems && (
        <p className="text-sm text-muted-foreground">
          {itemsShowing} / {totalItems} résultats
        </p>
      )}
      
      <Button
        onClick={onClick}
        disabled={isLoading}
        className="gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 dark:from-purple-500 dark:to-pink-500 text-white font-semibold px-8 py-6 text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('common.loading')}
          </>
        ) : (
          <>
            <ChevronDown className="w-5 h-5" />
            {t('common.loadMore')}
          </>
        )}
      </Button>
    </motion.div>
  );
};
