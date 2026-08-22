import * as React from 'react';

const SMALL_LAPTOP_BREAKPOINT = 1025;

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(
    `(max-width: ${SMALL_LAPTOP_BREAKPOINT - 1}px)`
  );
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

const getSnapshot = () => window.innerWidth < SMALL_LAPTOP_BREAKPOINT;

const getServerSnapshot = () => false;

export function useIsSmallLaptop() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
