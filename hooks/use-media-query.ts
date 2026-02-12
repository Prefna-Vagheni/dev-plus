'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch
  // (Server has no window, so it starts false)
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    if (media.matches !== matches) {
      //eslint-disable-next-line
      setMatches(media.matches);
    }

    // Define listener to update state on resize
    const listener = () => setMatches(media.matches);

    // Modern browsers use addEventListener, older use addListener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}
