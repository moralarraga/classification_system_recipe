export default function SaveButton({saved, onSave, title}) {
  return (
    <button type="button" className={'save-btn' + (saved ? ' on' : '')} aria-pressed={saved}
      aria-label={`${saved ? 'Unsave' : 'Save'} ${title}`} onClick={(e) => { e.stopPropagation(); onSave(); }}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.4 1.1 4.2 2.4h2C13.8 6.1 15.2 5 17.2 5c3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
