import { useEffect, type RefObject } from "react";

/**
 * Custom hook that smoothly scrolls to center an element in the viewport
 * when a trigger condition becomes true.
 *
 * @param elementRef - React ref to the element that should be centered
 * @param shouldScroll - Boolean trigger that activates the scroll when true
 */
export function useSmoothScrollToCenter<T extends HTMLElement>(
  elementRef: RefObject<T | null>,
  shouldScroll: boolean
) {
  useEffect(() => {
    if (shouldScroll && elementRef.current) {
      const element = elementRef.current;
      const elementRect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Calculate position to center the element
      const targetScroll =
        scrollTop +
        elementRect.top -
        viewportHeight / 2 +
        elementRect.height / 2;

      // Smooth scroll
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [shouldScroll, elementRef]);
}
