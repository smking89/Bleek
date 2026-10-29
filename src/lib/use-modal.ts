"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modals stack (shop → item detail → gift), so Escape only pops the top one. */
const stack: symbol[] = [];
let scrollLocks = 0;
let previousOverflow = "";

export function useModalA11y(ref: RefObject<HTMLElement | null>, onClose: () => void, active = true) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const id = Symbol("modal");
    stack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (scrollLocks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    scrollLocks += 1;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );

    const frame = requestAnimationFrame(() => {
      const target = focusables()[0];
      if (target) target.focus({ preventScroll: true });
      else node.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      const index = stack.lastIndexOf(id);
      if (index >= 0) stack.splice(index, 1);

      scrollLocks -= 1;
      if (scrollLocks <= 0) {
        scrollLocks = 0;
        document.body.style.overflow = previousOverflow;
      }

      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, ref]);
}
