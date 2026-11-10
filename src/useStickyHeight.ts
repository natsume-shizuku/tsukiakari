import { useLayoutEffect, useRef } from 'react';

/** Keep sticky siblings and jump targets clear when a toolbar wraps or text grows. */
export function useStickyHeight<T extends HTMLElement>(property: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    const measure = () => parent.style.setProperty(property, `${Math.ceil(element.getBoundingClientRect().height)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); parent.style.removeProperty(property); };
  }, [property]);
  return ref;
}
