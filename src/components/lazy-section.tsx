"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export function LazySection({
  children,
  className = "",
  delay = 0,
  id
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -12% 0px"
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`lazy-section${visible ? " lazy-section-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--section-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </section>
  );
}
