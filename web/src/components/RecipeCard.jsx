import {motion} from 'framer-motion';
import {cleanCuisine, crScore, ingredientCount, titleCase} from '../lib/facets.js';
import {formatMinutes} from '../lib/browse.js';
import CrBadge from './CrBadge.jsx';
import SaveButton from './SaveButton.jsx';

export default function RecipeCard({recipe: r, saved, onOpen, onSave}) {
  const c = cleanCuisine(r);
  const origin = c.countries.length ? c.countries.join(', ') : c.regions.join(', ');
  return (
    <motion.li className="card" layout="position" initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} transition={{duration: .2}}>
      <div className={'card-btn' + (crScore(r) >= 3 ? ' card-cultural' : '')} role="button" tabIndex={0} onClick={onOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}>
        <div className="card-top">
          <span className="card-id">{r.id}</span>
          {r._isSubRecipe && <span className="tag">Sub-recipe</span>}
          <CrBadge recipe={r} label="Relevance" />
          <SaveButton saved={saved} onSave={onSave} title={r.title} />
        </div>
        <h3 className="card-title">{r.title}</h3>
        {r.description && <p className="card-desc">{r.description}</p>}
        <dl className="card-meta">
          <div><dt>Origin</dt><dd>{origin || 'No country'}</dd></div>
          <div><dt>Time</dt><dd>{formatMinutes(r.time?.total_min)}</dd></div>
          <div><dt>Ingredients</dt><dd>{ingredientCount(r)}</dd></div>
        </dl>
        <p className="card-source">{titleCase(r.source?.site || 'unknown')}</p>
      </div>
    </motion.li>
  );
}
