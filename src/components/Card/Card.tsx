import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps, useStore } from 'reactflow';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Maximize2, Trash2, GripHorizontal } from 'lucide-react';
import { useCanvasStore, CardData } from '../../store/canvasStore';
import { useSettingsStore, CARD_WIDTHS } from '../../store/settingsStore';
import { CardEditor } from '../CardEditor/CardEditor';
import { extractSummary, cardTitle } from '../../utils/markdown';
import { SummaryHighlight } from '../../utils/summaryHighlightExtension';
import { countWords, WORD_LIMIT } from '../../utils/wordCount';
import { levelOf, worldOf } from '../../game/worlds';
import { Building, Hammer } from '../../game/sprites';
import { game } from '../../game/game';
import './Card.css';

const SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
];

const getMarkdown = (editor: Editor): string => (editor.storage as any).markdown.getMarkdown();

/** Stable 0–3 index from the card id, so themes can tint cards without it shifting around. */
function tintOf(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 4;
}

function CardComponent({ id, data, selected, dragging }: NodeProps<CardData>) {
  const [editing, setEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [words, setWords] = useState(data?.wordCount ?? countWords(data?.body ?? ''));
  const cardRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef(words);
  const world = worldOf(useSettingsStore((s) => s.theme));
  const growth = levelOf(words);
  const lastLevel = useRef(growth.level);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotted = useRef(false);
  const wasEditing = useRef(false);

  const summaryMode = useSettingsStore((s) => s.summaryMode);
  const showSummaries = useSettingsStore((s) => s.showSummaries);
  const cardWidth = useSettingsStore((s) => s.cardWidth);
  const zoomedOut = useStore((state) => state.transform[2] < 0.6);
  const collapsed = summaryMode === 'zoom' ? zoomedOut : showSummaries;
  const width = CARD_WIDTHS[cardWidth];

  const save = (editor: Editor) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const body = getMarkdown(editor);
    useCanvasStore.getState().updateCard(id, {
      body,
      summary: extractSummary(body),
      wordCount: countWords(editor.state.doc.textContent),
      isNew: false,
    });
  };

  const openFocusMode = () => {
    if (inlineEditor) save(inlineEditor);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      (window as any).__cardEditorInitialBounds = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    }
    inlineEditor?.commands.blur();
    setShowEditor(true);
  };
  const openFocusModeRef = useRef(openFocusMode);
  openFocusModeRef.current = openFocusMode;

  const inlineEditor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
      Placeholder.configure({ placeholder: 'Write something…' }),
      SummaryHighlight,
    ],
    content: data?.body || '',
    editorProps: {
      attributes: { class: 'prose' },
      // The canvas is the scroll surface; never let the browser scroll containers to chase the caret.
      handleScrollToSelection: () => true,
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          openFocusModeRef.current();
          return true;
        }
        if (event.key === 'Escape') {
          (event.target as HTMLElement).blur();
          return true;
        }
        return false;
      },
    },
    onFocus: () => {
      setEditing(true);
      snapshotted.current = false;
    },
    onUpdate: ({ editor }) => {
      // One undo step per editing session, taken just before the first change lands.
      if (!snapshotted.current) {
        useCanvasStore.getState().snapshot();
        snapshotted.current = true;
      }
      const count = countWords(editor.state.doc.textContent);
      if (count > wordsRef.current) game.word(plotRef.current);
      wordsRef.current = count;
      setWords(count);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(editor), 800);
    },
    onBlur: ({ editor }) => {
      setEditing(false);
      save(editor);
    },
  });

  // Pull in changes made elsewhere (undo, focus mode) while this editor isn't the one being typed in.
  useEffect(() => {
    if (!inlineEditor || inlineEditor.isDestroyed || inlineEditor.isFocused) return;
    const body = data?.body || '';
    if (getMarkdown(inlineEditor) !== body) {
      inlineEditor.commands.setContent(body, { emitUpdate: false } as any);
      wordsRef.current = countWords(inlineEditor.state.doc.textContent);
      setWords(wordsRef.current);
    }
  }, [data?.body, inlineEditor]);

  // A freshly created note takes the cursor so you can just start typing.
  useEffect(() => {
    if (!data?.isNew || !inlineEditor) return;
    game.place(cardRef.current);
    const frame = requestAnimationFrame(() => inlineEditor.commands.focus('end', { scrollIntoView: false }));
    return () => cancelAnimationFrame(frame);
  }, [data?.isNew, inlineEditor]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  // In a world, the note's building upgrades as it crosses word thresholds.
  useEffect(() => {
    const grew = growth.level > lastLevel.current;
    lastLevel.current = growth.level;
    if (grew && world) game.levelUp(plotRef.current, world.levels[growth.level]);
  }, [growth.level, world]);

  const plot = world && (
    <div className="plot" ref={plotRef}>
      <Building key={growth.level} world={world.id} level={growth.level} tint={tintOf(id)} />
      {editing && <Hammer />}
      <div className="plot-info">
        <span>{world.levels[growth.level]}</span>
        {growth.next ? (
          <>
            <span className="plot-bar">
              <i style={{ width: `${growth.progress * 100}%` }} />
            </span>
            <span className="plot-count">
              {words}/{growth.next}
            </span>
          </>
        ) : (
          <span className="plot-count">fully grown</span>
        )}
      </div>
    </div>
  );

  const handles = SIDES.map((side) => (
    <Handle key={side.id} type="source" id={side.id} position={side.position} className="card-handle" />
  ));

  const stateClasses = `${selected ? ' is-selected' : ''}${dragging ? ' is-dragging' : ''}${editing ? ' is-editing' : ''}`;

  if (collapsed) {
    const title = cardTitle(data?.body || '', data?.summary);
    return (
      <div
        ref={cardRef}
        className={`card card--summary${stateClasses}`}
        data-tint={tintOf(id)}
        style={{ width: width.summary }}
      >
        {handles}
        {plot}
        <span className={title ? '' : 'card-untitled'}>{title || 'Empty note'}</span>
      </div>
    );
  }

  const overLimit = words > WORD_LIMIT;

  return (
    <div ref={cardRef} className={`card${stateClasses}`} data-tint={tintOf(id)} style={{ width: width.full }}>
      {handles}
      {plot}

      <div className="card-bar">
        <GripHorizontal className="card-grip" size={14} aria-hidden />
        <div className="card-actions nodrag">
          <button className="card-action" onClick={openFocusMode} title="Focus mode (⌘↵)" aria-label="Focus mode">
            <Maximize2 size={13} />
          </button>
          <button
            className="card-action card-action--danger"
            onClick={() => useCanvasStore.getState().deleteCard(id)}
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Draggable until you're typing in it; then it behaves like text. */}
      <div
        className={`card-body${editing ? ' nodrag nopan' : ''}`}
        onMouseDown={() => {
          wasEditing.current = editing;
        }}
        onClick={(event) => {
          // The click that starts editing also has to place the caret: the canvas's drag
          // handling swallows the browser's own caret placement on that first press.
          if (wasEditing.current || !inlineEditor) return;
          const hit = inlineEditor.view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (hit) inlineEditor.chain().focus(null, { scrollIntoView: false }).setTextSelection(hit.pos).run();
          else inlineEditor.commands.focus('end', { scrollIntoView: false });
        }}
      >
        <EditorContent editor={inlineEditor} />
      </div>

      {words > 0 && (
        <div className={`card-count${overLimit ? ' is-long' : ''}`}>
          {words} {words === 1 ? 'word' : 'words'}
          {overLimit && ' · getting long'}
        </div>
      )}

      {showEditor && <CardEditor cardId={id} initialBody={data?.body || ''} onClose={() => setShowEditor(false)} />}
    </div>
  );
}

export const Card = memo(CardComponent);
