interface CmsContentProps {
  html: string;
  className?: string;
}

export function CmsContent({ html, className = '' }: CmsContentProps) {
  // The page title is the H1; legacy editor H1s become article section headings.
  const articleHtml = html.replace(/<(\/?)h1(?=[\s>])/gi, '<$1h2');
  return (
    <div
      className={`cms-content ${className}`}
      dangerouslySetInnerHTML={{ __html: articleHtml }}
    />
  );
}
