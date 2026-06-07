interface CmsContentProps {
  html: string;
  className?: string;
}

export function CmsContent({ html, className = '' }: CmsContentProps) {
  return (
    <div
      className={`cms-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
