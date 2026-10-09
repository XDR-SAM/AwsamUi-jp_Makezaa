import { renderCmsContent } from '@/lib/cms-rendering';

interface CmsContentProps {
  html: string;
  className?: string;
}

export function CmsContent({ html, className = '' }: CmsContentProps) {
  const articleHtml = renderCmsContent(html);
  return (
    <div
      className={`cms-content ${className}`}
      dangerouslySetInnerHTML={{ __html: articleHtml }}
    />
  );
}
