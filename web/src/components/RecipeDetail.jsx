import {useEffect, useRef} from 'react';
import {motion} from 'framer-motion';
import {cleanCuisine, titleCase} from '../lib/facets.js';
import {formatMinutes} from '../lib/browse.js';
import CrBadge from './CrBadge.jsx';
import SaveButton from './SaveButton.jsx';

export default function RecipeDetail({recipe: r, data, saved, onSave, onOpen, onClose}) {
  const box = useRef(null);
  useEffect(() => { box.current?.scrollTo(0, 0); box.current?.focus(); }, [r.id]);
  const c = cleanCuisine(r);
  const cr = r['cultural relevance'] || {};
  const seen = new Set();
  // Combined lines ("salt and pepper") share one raw text; show each printed line once.
  const ingredients = (r.ingredients || []).filter((i) => {
    const k = i.raw + '|' + (i.recipe_ref || '');
    return seen.has(k) ? false : (seen.add(k), true);
  });
  const link = (id, text) => <a href={`#recipe=${id}`} onClick={(e) => { e.preventDefault(); onOpen(id); }}>{text}</a>;

  return (
    <motion.div className="overlay" onClick={onClose} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
      <motion.div ref={box} className="sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        initial={{opacity: 0, y: 30, scale: .98}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: 20}}
        transition={{type: 'spring', stiffness: 260, damping: 28}}>
        <div className="sheet-actions">
          <SaveButton saved={saved} onSave={onSave} title={r.title} />
          <button type="button" className="close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <p className="detail-id">{r.id}{r._isSubRecipe ? ' · Sub-recipe' : ''}</p>
        <h2 id="detail-title">{r.title}</h2>
        {r.description && <p className="detail-desc">{r.description}</p>}
        <dl className="detail-facts">
          <div><dt>Region</dt><dd>{c.regions.join(', ') || 'None'}</dd></div>
          <div><dt>Country / origin</dt><dd>{c.countries.join(', ') || 'None'}</dd></div>
          <div><dt>Prep</dt><dd>{formatMinutes(r.time?.prep_min)}</dd></div>
          <div><dt>Cook</dt><dd>{formatMinutes(r.time?.cook_min)}</dd></div>
          <div><dt>Total</dt><dd>{formatMinutes(r.time?.total_min)}</dd></div>
          <div><dt>Servings</dt><dd>{r.servings ?? 'Not given'}</dd></div>
        </dl>
        <section>
          <h3>Cultural relevance</h3>
          <CrBadge recipe={r} />
          <p className={cr.reasoning ? undefined : 'muted'}>{cr.reasoning || 'No reasoning recorded.'}</p>
        </section>
        {data.usedIn.has(r.id) && (
          <section>
            <h3>Used in</h3>
            <ul className="plain">{data.usedIn.get(r.id).map((p) => <li key={p.id}>{link(p.id, p.title)}</li>)}</ul>
          </section>
        )}
        <div className="detail-cols">
          <section>
            <h3>Ingredients ({ingredients.length})</h3>
            <ul className="ingredients">
              {ingredients.map((i, n) => (
                <li key={n}>{i.raw}
                  {i.recipe_ref && data.byId.has(i.recipe_ref) &&
                    <span className="subref">{link(i.recipe_ref, `See recipe: ${data.byId.get(i.recipe_ref).title}`)}</span>}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Steps</h3>
            <ol className="steps">{(r.steps || []).map((s, n) => <li key={n}>{s}</li>)}</ol>
          </section>
        </div>
        <footer className="detail-source">
          Source: {r.source?.url
            ? <a href={r.source.url} target="_blank" rel="noopener noreferrer">{titleCase(r.source.site || r.source.url)}</a>
            : titleCase(r.source?.site || 'unknown')}
          {r.source?.author ? ` · ${r.source.author}` : ''}
          {r.source?.retrieved ? ` · retrieved ${r.source.retrieved}` : ''}
        </footer>
      </motion.div>
    </motion.div>
  );
}
