import {useState} from 'react';
import {FACETS} from '../lib/facets.js';
import {facetCounts, facetValueList} from '../lib/browse.js';

function Facet({f, data, state, onToggle}) {
  const [expanded, setExpanded] = useState(false);
  const [find, setFind] = useState('');
  const sel = state.selected[f.id] || new Set();
  const counts = facetCounts(data, state, f);
  const show = (v) => (f.display ? f.display(v) : v);
  let values = facetValueList(data, f, counts, sel);
  const text = find.trim().toLowerCase();
  if (text) values = values.filter((v) => show(v).toLowerCase().includes(text));
  const limit = f.collapsedLimit || Infinity;
  const visible = expanded || text ? values : values.filter((v, i) => i < limit || sel.has(v));

  return (
    <section className={'facet' + (sel.size ? ' has-selection' : '')}>
      <h3>{f.label}</h3>
      {f.hint && <p className="facet-hint">{f.hint}</p>}
      {f.searchable && (
        <input type="search" className="facet-filter" value={find} onChange={(e) => setFind(e.target.value)}
          placeholder={`Find ${f.label.toLowerCase()}…`} aria-label={`Find a value in ${f.label}`} />
      )}
      <ul className="facet-values">
        {visible.map((v) => {
          const n = counts.get(v) || 0, on = sel.has(v), id = `f-${f.id}-${String(v).replace(/[^a-z0-9]/gi, '_')}`;
          return (
            <li key={v} className={n === 0 && !on ? 'empty' : undefined}>
              <input type="checkbox" id={id} className={f.id === 'cr' && /^\d$/.test(v) ? `cr-check ${Number(v) >= 3 ? 'cr-check-cultural' : 'cr-check-basic'}` : undefined} checked={on} disabled={n === 0 && !on} onChange={() => onToggle(f.id, v)} />
              <label htmlFor={id}><span>{show(v)}</span><span className="v-count">{n}</span></label>
            </li>
          );
        })}
      </ul>
      {!text && values.length > limit && (
        <button type="button" className="link-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show fewer' : `Show all ${values.length}`}
        </button>
      )}
    </section>
  );
}

export default function FacetPanel(props) {
  return FACETS.map((f) => <Facet key={f.id} f={f} {...props} />);
}
