"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Anima los hijos directos en cascada en vez de animar el contenedor entero. */
  stagger?: boolean;
};

/** Envoltorio que agrega la clase `is-visible` cuando entra en viewport, para las animaciones .lp-reveal / .lp-reveal-stagger. */
export function Reveal({ children, className = "", stagger = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${stagger ? "lp-reveal-stagger" : "lp-reveal"} ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
