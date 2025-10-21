'use client';

import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      setMatches(media.matches);

      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Modern browsers
      if (media.addEventListener) {
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
      }
      // Legacy browsers
      else {
        media.addListener(listener);
        return () => media.removeListener(listener);
      }
    }
  }, [query]);

  return matches;
};

// Predefined media query hooks
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsSmallScreen = () => useMediaQuery('(max-width: 575px)');
export const useIsMediumScreen = () => useMediaQuery('(min-width: 576px) and (max-width: 991px)');
export const useIsLargeScreen = () => useMediaQuery('(min-width: 992px)');