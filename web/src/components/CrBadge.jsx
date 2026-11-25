import {crScore} from '../lib/facets.js';

export default function CrBadge({recipe, label = 'CR'}) {
  const s = crScore(recipe);
  if (s === null) return <span className="cr cr-none" title="Cultural relevance not labeled">{label} –</span>;
  return (
    <span className={`cr cr-${s}`} title={`Cultural relevance ${s} of 5`}>
      <span className="cr-dots" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < s ? 'on' : undefined} />)}
      </span>
      <span>{label} {s}</span>
    </span>
  );
}
