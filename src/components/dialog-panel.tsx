"use client";

import { useRef, type ReactNode } from "react";
import { useModalA11y } from "@/lib/use-modal";

/**
 * The visible panel of a dialog. The overlay and backdrop stay in each modal so
 * they can keep their own sizing, while focus handling and dialog semantics live here.
 */
export function DialogPanel({
  label,
  onClose,
  active = true,
  className = "",
  children,
}: {
  label: string;
  onClose: () => void;
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useModalA11y(ref, onClose, active);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className={`outline-none ${className}`}
    >
      {children}
    </div>
  );
}
