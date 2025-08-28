import React, { useEffect, useState } from 'react';
import yaml from 'js-yaml';

interface IgemSummaryProps {
  partId: string;
}

interface PartMeta {
  Part: string;
  href: string;
  Description: string;
}

const IgemSummary: React.FC<IgemSummaryProps> = ({ partId }) => {
  const [meta, setMeta] = useState<PartMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/meta.yml')
      .then((res) => res.text())
      .then((text) => {
        const data = yaml.load(text) as PartMeta[];
        const found = data.find((item) => item.Part === partId);
        setMeta(found || null);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load metadata');
        setLoading(false);
      });
  }, [partId]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!meta) return <div className="p-4">No summary found for this part.</div>;

  return (
    <div className="p-4 bg-gray-100 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-bold">Part: {meta.Part} Summary</h3>
        <a
          href={meta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          Open Original ↗
        </a>
      </div>
      <div className="igem-summary-content" dangerouslySetInnerHTML={{ __html: meta.Description }} />
    </div>
  );
};

export default IgemSummary; 