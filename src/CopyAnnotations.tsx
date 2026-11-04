import { useEffect, useId, useState } from 'react';
import type { LearningCopy } from './domain';
import { saveCopyAnnotations } from './collectionStorage';
import type { useWorkspace } from './useWorkspace';
import './library.css';

export function CopyAnnotations({ desk, copy, onDirtyChange, onSaved, onDiscard }: {
  desk: ReturnType<typeof useWorkspace>; copy: LearningCopy; onDirtyChange?: (dirty: boolean) => void; onSaved?: () => void; onDiscard?: () => void;
}) {
  const id = useId();
  const [note, setNote] = useState(copy.personalNote);
  const [tags, setTags] = useState(copy.tags.filter(tag => tag !== 'leech').join(', '));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const initialTags = copy.tags.filter(tag => tag !== 'leech').join(', ');
  const dirty = note !== copy.personalNote || tags !== initialTags;
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const values = tags.split(',').map(tag => tag.trim()).filter(Boolean).filter((tag, index, all) => all.findIndex(other => other.toLocaleLowerCase('en') === tag.toLocaleLowerCase('en')) === index);
    if (values.length + (copy.tags.includes('leech') && !values.some(tag => tag.toLocaleLowerCase('en') === 'leech') ? 1 : 0) > 30 || values.some(tag => tag.length > 60)) {
      setError('Use up to 30 tags, with at most 60 characters per tag.'); return;
    }
    setError(''); setSaved('');
    const success = await desk.mutate(() => saveCopyAnnotations(copy.id, { personalNote: note, tags: values }), 'Personal notes and tags saved.');
    if (success) { setNote(note.trim()); setTags(values.filter(tag => copy.tags.includes('leech') ? tag.toLocaleLowerCase('en') !== 'leech' : tag !== 'leech').join(', ')); setSaved('Saved.'); onDirtyChange?.(false); onSaved?.(); }
  };
  return <form className="copy-annotations" onSubmit={event => void save(event)}>
    <h3>Personal notes and tags</h3>
    <p className="fine-print">Saved for this deck’s copy. Personal notes are your own, unverified annotations.</p>
    <label htmlFor={id + '-note'}>Personal note</label>
    <textarea id={id + '-note'} value={note} onChange={event => { setNote(event.target.value); setSaved(''); }} maxLength={20000} rows={5} disabled={!desk.canWrite}/>
    <label htmlFor={id + '-tags'}>Personal tags (comma separated)</label>
    <input id={id + '-tags'} value={tags} onChange={event => { setTags(event.target.value); setSaved(''); }} disabled={!desk.canWrite}/>
    {copy.tags.includes('leech') && <p className="fine-print"><span className="leech-badge">Leech</span> System tag retained from review history.</p>}
    {error && <p role="alert" className="annotation-error">{error}</p>}
    <div className="library-actions"><button className="button" disabled={!desk.canWrite || !dirty}>Save notes and tags</button><button type="button" className="button secondary" disabled={(!dirty && !onDiscard) || desk.busy} onClick={() => { setNote(copy.personalNote); setTags(initialTags); setError(''); setSaved(''); onDirtyChange?.(false); onDiscard?.(); }}>Discard changes</button><span role="status">{saved || (dirty ? 'Unsaved changes' : '')}</span></div>
  </form>;
}
