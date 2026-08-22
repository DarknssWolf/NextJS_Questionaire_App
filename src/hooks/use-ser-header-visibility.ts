import { useEffect, useState } from 'react';

export function useSERHeaderVisibility() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsHeaderVisible(entry.isIntersecting);
        });
      },
      {
        rootMargin: '0px',
        threshold: 0,
      }
    );

    observer.observe(header);

    return () => {
      observer.disconnect();
    };
  }, []);

  return isHeaderVisible;
}
