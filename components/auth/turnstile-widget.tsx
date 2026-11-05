"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: { sitekey: string; action: string; theme: "light" }) => string;
  reset: (widget?: string) => void;
  remove: (widget: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

// Renders explicitly instead of relying on Turnstile's on-load page scan, which misses widgets on pages reached
// by client-side navigation once the script is already loaded. Changing resetKey issues a fresh single-use token.
export function TurnstileWidget({ siteKey, action, resetKey }: { siteKey: string; action: string; resetKey?: unknown }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);

  const render = () => {
    if (!window.turnstile || !container.current || widget.current) return;
    widget.current = window.turnstile.render(container.current, { sitekey: siteKey, action, theme: "light" });
  };

  useEffect(() => {
    const element = container.current;
    if (window.turnstile && element && !widget.current) widget.current = window.turnstile.render(element, { sitekey: siteKey, action, theme: "light" });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = undefined;
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (resetKey !== undefined && widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={render} />
      <div ref={container} className="cf-turnstile" />
    </>
  );
}
