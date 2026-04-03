"use client";

import { usePretextBubble, type BubbleOptions } from "@/hooks/usePretextBubble";

type Tag = "p" | "h1" | "h2" | "h3" | "h4" | "span" | "div";

interface PretextTextProps extends BubbleOptions {
  as?: Tag;
  className?: string;
  dangerouslySetInnerHTML?: { __html: string };
  children?: React.ReactNode;
  [key: string]: unknown;
}

/**
 * Drop-in wrapper: renders any block element and attaches Pretext bubble on hover.
 * Text reflows around the cursor using Pretext's layoutNextLine — no DOM mutations.
 */
export default function PretextText({
  as: Tag = "p",
  className,
  size,
  color = "rgba(255,255,255,0.06)",
  gutter,
  dangerouslySetInnerHTML,
  children,
  ...rest
}: PretextTextProps) {
  const ref = usePretextBubble<HTMLDivElement>({ size, color, gutter });

  // Cast to any to avoid per-tag ref variance issues — safe at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagAny = Tag as any;

  if (dangerouslySetInnerHTML) {
    return <TagAny ref={ref} className={className} dangerouslySetInnerHTML={dangerouslySetInnerHTML} {...rest} />;
  }

  return <TagAny ref={ref} className={className} {...rest}>{children}</TagAny>;
}
