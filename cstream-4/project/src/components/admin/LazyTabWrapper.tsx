import { Suspense, lazy, ComponentType, memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LazyTabWrapperProps {
  isActive: boolean;
  fallback: React.ReactNode;
  children: React.ReactNode;
}

export const LazyTabWrapper = memo(({ isActive, fallback, children }: LazyTabWrapperProps) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isActive && !hasLoaded) {
      setHasLoaded(true);
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, hasLoaded]);

  if (!hasLoaded) {
    return null;
  }

  return (
    <Suspense fallback={fallback}>
      {showContent ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      ) : (
        fallback
      )}
    </Suspense>
  );
});

export function useLazyTab(tabName: string, activeTab: string) {
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const isActive = tabName === activeTab;

  useEffect(() => {
    if (isActive && !loadedTabs.has(tabName)) {
      setLoadedTabs(prev => new Set(prev).add(tabName));
    }
  }, [isActive, tabName, loadedTabs]);

  return {
    isActive,
    shouldRender: loadedTabs.has(tabName) || isActive,
    isLoaded: loadedTabs.has(tabName)
  };
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}
