import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Minimize2 } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { extractSummary } from '../../utils/markdown';
import { SummaryHighlight } from '../../utils/summaryHighlightExtension';
import { countWords, WORD_LIMIT } from '../../utils/wordCount';
import './CardEditor.css';

interface CardEditorProps {
  cardId: string;
  initialBody: string;
  onClose: () => void;
}

const getMarkdown = (editor: Editor): string => (editor.storage as any).markdown.getMarkdown();

/** Focus mode: one note, full screen, nothing else. */
export function CardEditor({ cardId, initialBody, onClose }: CardEditorProps) {
  const [words, setWords] = useState(() => countWords(initialBody));
  const editorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotted = useRef(false);

  const save = useCallback(
    (editor: Editor) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      const body = getMarkdown(editor);
      useCanvasStore.getState().updateCard(cardId, {
        body,
        summary: extractSummary(body),
        wordCount: countWords(editor.state.doc.textContent),
      });
    },
    [cardId]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
      Placeholder.configure({ placeholder: 'Write something…' }),
      SummaryHighlight,
    ],
    content: initialBody,
    autofocus: 'end',
    editorProps: { attributes: { class: 'prose' } },
    onUpdate: ({ editor }) => {
      if (!snapshotted.current) {
        useCanvasStore.getState().snapshot();
        snapshotted.current = true;
      }
      setWords(countWords(editor.state.doc.textContent));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(editor), 800);
    },
  });

  const handleClose = useCallback(() => {
    if (editor && snapshotted.current) save(editor);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    onClose();
  }, [editor, save, onClose]);

  // FLIP: grow out of the card's position on the canvas
  useEffect(() => {
    const from = (window as any).__cardEditorInitialBounds;
    const panel = editorRef.current;
    const overlay = overlayRef.current;
    if (!from || !panel || !overlay) return;
    delete (window as any).__cardEditorInitialBounds;

    const to = panel.getBoundingClientRect();
    panel.style.transition = 'none';
    panel.style.transform = `translate(${from.left - to.left + (from.width - to.width) / 2}px, ${
      from.top - to.top + (from.height - to.height) / 2
    }px) scale(${from.width / to.width}, ${from.height / to.height})`;
    panel.style.opacity = '0.4';
    panel.getBoundingClientRect();

    requestAnimationFrame(() => {
      panel.style.transition = 'transform 0.32s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease-out';
      panel.style.transform = 'none';
      panel.style.opacity = '1';
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [handleClose]);

  return createPortal(
    <div ref={overlayRef} className="card-editor-overlay">
      <div ref={editorRef} className="card-editor">
        <div className="card-editor-header">
          <span className={`card-editor-count${words > WORD_LIMIT ? ' is-long' : ''}`}>
            {words} {words === 1 ? 'word' : 'words'}
          </span>
          <button className="card-editor-close" onClick={handleClose} title="Back to canvas (Esc)">
            <Minimize2 size={15} />
            <span>Back to canvas</span>
            <kbd>Esc</kbd>
          </button>
        </div>

        <div
          className="card-editor-content"
          onClick={(e) => {
            if (e.target === e.currentTarget) editor?.commands.focus('end');
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')!
  );
}
