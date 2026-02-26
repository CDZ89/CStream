import { useEffect } from 'react';

export const useImagePreloader = (imageUrls: string[]) => {
  useEffect(() => {
    const preloadImages = async () => {
      const promises = imageUrls
        .filter(url => url && typeof url === 'string')
        .map(url => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(url);
            img.onerror = () => resolve(null);
            // Timeout after 5s to avoid hanging
            setTimeout(() => resolve(null), 5000);
          });
        });
      
      await Promise.allSettled(promises);
    };

    if (imageUrls.length > 0) {
      preloadImages();
    }
  }, [imageUrls]);
};

export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = () => resolve();
    setTimeout(() => resolve(), 5000);
  });
};
