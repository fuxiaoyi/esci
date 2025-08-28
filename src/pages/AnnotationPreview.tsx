import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const AnnotationPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [html, setHtml] = React.useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem(`annotation_preview_${id}`);
      setHtml(stored);
      document.title = 'Annotation Results Preview';
    }
  }, [id]);

  useEffect(() => {
    // Set charset meta if possible
    const meta = document.createElement('meta');
    meta.setAttribute('charset', 'utf-8');
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  if (!id) {
    return <div className="p-8 text-center text-lg">Invalid preview link.</div>;
  }
  if (!html) {
    return <div className="p-8 text-center text-lg">No preview found for this link.</div>;
  }
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default AnnotationPreview; 