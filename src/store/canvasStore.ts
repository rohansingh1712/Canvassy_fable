import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  Viewport,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { extractSummary } from '../utils/markdown';
import { countWords } from '../utils/wordCount';

export interface CardData {
  id: string;
  body: string;
  summary: string;
  wordCount: number;
  /** Set on creation so the card grabs focus; never persisted. */
  isNew?: boolean;
}

export interface EdgeData {
  label?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  directionality?: 'forward' | 'backward' | 'both' | 'none';
}

interface Snapshot {
  nodes: Node<CardData>[];
  edges: Edge<EdgeData>[];
}

export interface Toast {
  id: number;
  message: string;
  undoable?: boolean;
}

interface CanvasState {
  nodes: Node<CardData>[];
  edges: Edge<EdgeData>[];
  past: Snapshot[];
  future: Snapshot[];
  isConnecting: boolean;
  toast: Toast | null;

  addCard: (position: { x: number; y: number }, options?: { linkFrom?: string; body?: string }) => string;
  addWelcomeCards: (origin?: { x: number; y: number }) => void;
  deleteCard: (id: string) => void;
  deleteSelected: () => boolean;
  updateCard: (id: string, data: Partial<CardData>) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  connectNodes: (source: string, target: string) => void;
  updateEdge: (id: string, data: Partial<EdgeData>) => void;
  deleteEdge: (id: string) => void;
  /** Record the current state so the next change can be undone. */
  snapshot: () => void;
  undo: () => void;
  redo: () => void;
  setConnecting: (connecting: boolean) => void;
  showToast: (message: string, undoable?: boolean) => void;
  dismissToast: () => void;
}

const STORAGE_KEY = 'canvassy-data';
const VIEWPORT_KEY = 'canvassy-viewport';
const HISTORY_LIMIT = 60;

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function makeCard(position: { x: number; y: number }, body = '', isNew = false): Node<CardData> {
  const id = uid('card');
  return {
    id,
    type: 'customCard',
    position,
    data: { id, body, summary: extractSummary(body), wordCount: countWords(body), isNew },
  };
}

function makeEdge(source: string, target: string, data: EdgeData = {}): Edge<EdgeData> {
  return { id: uid('edge'), source, target, data };
}

function welcomeSet(origin = { x: 0, y: 0 }): Snapshot {
  const intro = makeCard(
    origin,
    `# Welcome to Canvassy

A place to think in space. Scatter half-formed ideas across the canvas, draw lines between them, then zoom into one and write.

@summary Start here`
  );
  const moving = makeCard(
    { x: origin.x + 520, y: origin.y - 60 },
    `## Getting around

- **Double-click** the canvas for a new note, or press **N**
- **Scroll** to pan, **pinch** to zoom
- **Drag** a note anywhere to move it
- **⌘Z** undoes anything, including deletes

@summary Getting around`
  );
  const linking = makeCard(
    { x: origin.x + 520, y: origin.y + 300 },
    `## Connecting ideas

- Drag from a dot on a note's edge onto another note
- Drop the line on **empty canvas** to spin off a new linked note
- Click a line to restyle it, double-click to label it

@summary Connecting ideas`
  );
  const writing = makeCard(
    { x: origin.x, y: origin.y + 330 },
    `## Writing

Notes take Markdown. Press **⌘↵** to open one in focus mode. Add a line starting with \`@summary\` and it becomes the note's title in summary view (**S**).

Try a different vibe with **T**.

@summary Writing`
  );
  return {
    nodes: [intro, moving, linking, writing],
    edges: [
      makeEdge(intro.id, moving.id),
      makeEdge(intro.id, linking.id),
      makeEdge(intro.id, writing.id, { lineStyle: 'dashed' }),
    ],
  };
}

function load(): Snapshot {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { nodes = [], edges = [] } = JSON.parse(stored);
      return {
        nodes: nodes.map((n: Node<CardData>) => ({ ...n, selected: false, dragging: false })),
        // Lines pick their own sides now, so handle ids saved by older versions are dropped.
        edges: edges.map(({ sourceHandle, targetHandle, ...e }: Edge<EdgeData>) => ({ ...e, selected: false })),
      };
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return welcomeSet();
}

export function loadViewport(): Viewport | null {
  try {
    const stored = localStorage.getItem(VIEWPORT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveViewport(viewport: Viewport) {
  try {
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(viewport));
  } catch {
    /* ignore */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let toastCounter = 0;

export const useCanvasStore = create<CanvasState>((set, get) => {
  const flush = () => {
    saveTimer = null;
    try {
      const { nodes, edges } = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          nodes: nodes.map(({ selected, dragging, ...n }) => ({ ...n, data: { ...n.data, isNew: undefined } })),
          edges: edges.map(({ selected, ...e }) => e),
        })
      );
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Dragging fires a change per frame, so writes are batched.
  const persist = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 250);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => saveTimer && flush());
  }

  const current = (): Snapshot => ({ nodes: get().nodes, edges: get().edges });

  return {
    ...load(),
    past: [],
    future: [],
    isConnecting: false,
    toast: null,

    snapshot: () => {
      set((state) => ({
        past: [...state.past.slice(-(HISTORY_LIMIT - 1)), current()],
        future: [],
      }));
    },

    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        nodes: previous.nodes.map((n) => ({ ...n, selected: false, dragging: false })),
        edges: previous.edges.map((e) => ({ ...e, selected: false })),
        past: past.slice(0, -1),
        future: [current(), ...future],
        toast: null,
      });
      persist();
    },

    redo: () => {
      const { past, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      set({
        nodes: next.nodes,
        edges: next.edges,
        past: [...past, current()],
        future: future.slice(1),
      });
      persist();
    },

    addCard: (position, options = {}) => {
      get().snapshot();
      const card = makeCard(position, options.body ?? '', true);
      set((state) => ({
        nodes: [...state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), card],
        edges: options.linkFrom ? [...state.edges, makeEdge(options.linkFrom, card.id)] : state.edges,
      }));
      persist();
      return card.id;
    },

    addWelcomeCards: (origin) => {
      get().snapshot();
      const welcome = welcomeSet(origin);
      set((state) => ({
        nodes: [...state.nodes, ...welcome.nodes],
        edges: [...state.edges, ...welcome.edges],
      }));
      persist();
    },

    deleteCard: (id) => {
      get().snapshot();
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      }));
      get().showToast('Note deleted', true);
      persist();
    },

    deleteSelected: () => {
      const { nodes, edges } = get();
      const nodeIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
      const edgeIds = new Set(edges.filter((e) => e.selected).map((e) => e.id));
      if (nodeIds.size === 0 && edgeIds.size === 0) return false;
      get().snapshot();
      set({
        nodes: nodes.filter((n) => !nodeIds.has(n.id)),
        edges: edges.filter((e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target)),
      });
      const message =
        nodeIds.size > 1 ? `${nodeIds.size} notes deleted` : nodeIds.size === 1 ? 'Note deleted' : 'Connection deleted';
      get().showToast(message, true);
      persist();
      return true;
    },

    updateCard: (id, data) => {
      set((state) => ({
        nodes: state.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...data } } : node)),
      }));
      persist();
    },

    onNodesChange: (changes) => {
      set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
      if (changes.some((c) => c.type === 'position' || c.type === 'remove')) persist();
    },

    onEdgesChange: (changes) => {
      set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
    },

    onConnect: (connection) => {
      if (connection.source && connection.target) get().connectNodes(connection.source, connection.target);
    },

    connectNodes: (source, target) => {
      if (source === target) return;
      const exists = get().edges.some(
        (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
      );
      if (exists) return;
      get().snapshot();
      set((state) => ({ edges: [...state.edges, makeEdge(source, target)] }));
      persist();
    },

    updateEdge: (id, data) => {
      get().snapshot();
      set((state) => ({
        edges: state.edges.map((edge) => (edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge)),
      }));
      persist();
    },

    deleteEdge: (id) => {
      get().snapshot();
      set((state) => ({ edges: state.edges.filter((edge) => edge.id !== id) }));
      get().showToast('Connection deleted', true);
      persist();
    },

    setConnecting: (isConnecting) => set({ isConnecting }),

    showToast: (message, undoable = false) => set({ toast: { id: ++toastCounter, message, undoable } }),
    dismissToast: () => set({ toast: null }),
  };
});
