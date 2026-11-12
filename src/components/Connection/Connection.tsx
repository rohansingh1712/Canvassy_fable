import { useCallback, useState } from 'react';
import { EdgeProps, EdgeLabelRenderer, Position, getBezierPath, useStore, Node } from 'reactflow';
import { ArrowRight, ArrowLeft, ArrowLeftRight, Minus, Type, Trash2 } from 'lucide-react';
import { useCanvasStore, EdgeData } from '../../store/canvasStore';
import { useSettingsStore } from '../../store/settingsStore';
import { worldOf } from '../../game/worlds';
import { Traveller } from '../../game/sprites';
import './Connection.css';

const LINE_STYLES: NonNullable<EdgeData['lineStyle']>[] = ['solid', 'dashed', 'dotted'];
const DIRECTIONS: NonNullable<EdgeData['directionality']>[] = ['forward', 'both', 'backward', 'none'];
const DIRECTION_ICON = { forward: ArrowRight, backward: ArrowLeft, both: ArrowLeftRight, none: Minus };
const DASH = { solid: undefined, dashed: '7 6', dotted: '1 6' };
const GAP = 6; // breathing room between a card edge and the line

interface Anchor {
  x: number;
  y: number;
  position: Position;
}

function rect(node: Node) {
  const { x, y } = node.positionAbsolute ?? node.position;
  return { x, y, w: node.width ?? 0, h: node.height ?? 0 };
}

/**
 * Lines attach to whichever sides of the two cards face each other,
 * and re-route as cards move, so arrows never double back through a card.
 */
function anchors(sourceNode: Node, targetNode: Node): [Anchor, Anchor] {
  const a = rect(sourceNode);
  const b = rect(targetNode);
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  const gapX = Math.abs(dx) - (a.w + b.w) / 2;
  const gapY = Math.abs(dy) - (a.h + b.h) / 2;

  const side = (r: typeof a, position: Position): Anchor => {
    switch (position) {
      case Position.Left:
        return { x: r.x - GAP, y: r.y + r.h / 2, position };
      case Position.Right:
        return { x: r.x + r.w + GAP, y: r.y + r.h / 2, position };
      case Position.Top:
        return { x: r.x + r.w / 2, y: r.y - GAP, position };
      default:
        return { x: r.x + r.w / 2, y: r.y + r.h + GAP, position };
    }
  };

  if (gapX >= gapY) {
    return dx >= 0
      ? [side(a, Position.Right), side(b, Position.Left)]
      : [side(a, Position.Left), side(b, Position.Right)];
  }
  return dy >= 0
    ? [side(a, Position.Bottom), side(b, Position.Top)]
    : [side(a, Position.Top), side(b, Position.Bottom)];
}

export function Connection({ id, source, target, data, selected }: EdgeProps<EdgeData>) {
  const sourceNode = useStore(useCallback((s) => s.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((s) => s.nodeInternals.get(target), [target]));
  const updateEdge = useCanvasStore((s) => s.updateEdge);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const arrowWidth = useSettingsStore((s) => s.arrowWidth);
  const arrowHeadSize = useSettingsStore((s) => s.arrowHeadSize);
  const world = worldOf(useSettingsStore((s) => s.theme));
  const [editingLabel, setEditingLabel] = useState(false);
  const [draft, setDraft] = useState('');

  if (!sourceNode || !targetNode || !sourceNode.width || !targetNode.width) return null;

  const [from, to] = anchors(sourceNode, targetNode);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: from.x,
    sourceY: from.y,
    sourcePosition: from.position,
    targetX: to.x,
    targetY: to.y,
    targetPosition: to.position,
  });

  const lineStyle = data?.lineStyle || 'solid';
  const direction = data?.directionality || 'forward';
  const label = data?.label || '';
  const hasEnd = direction === 'forward' || direction === 'both';
  const hasStart = direction === 'backward' || direction === 'both';
  const DirectionIcon = DIRECTION_ICON[direction];
  const length = Math.hypot(to.x - from.x, to.y - from.y) * 1.15;
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) % 9973;

  const startLabelEdit = () => {
    setDraft(label);
    setEditingLabel(true);
  };

  const commitLabel = () => {
    setEditingLabel(false);
    const next = draft.trim();
    if (next !== label) updateEdge(id, { label: next });
  };

  const cycle = <T,>(list: T[], value: T) => list[(list.indexOf(value) + 1) % list.length];

  const marker = (markerId: string, flip: boolean) => (
    <marker
      id={markerId}
      viewBox="0 0 10 10"
      refX={flip ? 1.5 : 8.5}
      refY="5"
      markerWidth={arrowHeadSize}
      markerHeight={arrowHeadSize}
      markerUnits="userSpaceOnUse"
      orient="auto"
    >
      <path
        d={flip ? 'M 8 1.5 L 1.5 5 L 8 8.5' : 'M 2 1.5 L 8.5 5 L 2 8.5'}
        className="connection-marker"
        strokeWidth={Math.max(1.2, (arrowWidth * 10) / arrowHeadSize)}
      />
    </marker>
  );

  return (
    <>
      <defs>
        {hasEnd && marker(`arrow-end-${id}`, false)}
        {hasStart && marker(`arrow-start-${id}`, true)}
      </defs>

      {/* In world themes the line is a road: a wide bed under the line, built as it appears */}
      <path d={edgePath} className="connection-bed connection-bed--edge" pathLength={1} />
      <path d={edgePath} className="connection-bed connection-bed--top" pathLength={1} />

      {/* Wide invisible stroke so the line is easy to hit */}
      <path d={edgePath} className="connection-hit" onDoubleClick={startLabelEdit} />

      <path
        d={edgePath}
        className={`connection-path${selected ? ' is-selected' : ''}`}
        style={{ strokeWidth: arrowWidth }}
        strokeDasharray={DASH[lineStyle]}
        strokeLinecap="round"
        markerEnd={hasEnd ? `url(#arrow-end-${id})` : undefined}
        markerStart={hasStart ? `url(#arrow-start-${id})` : undefined}
      />

      {/* Animated only in vibes that ask for it (see theme/motion.css) */}
      <path d={edgePath} className="connection-flow" />

      {world && direction !== 'backward' && (
        <Traveller world={world.id} path={edgePath} length={length} seed={seed} />
      )}
      {world && direction !== 'forward' && (
        <Traveller world={world.id} path={edgePath} length={length} seed={seed + 3} reverse />
      )}

      <EdgeLabelRenderer>
        <div
          className={`connection-overlay nodrag nopan${selected ? ' is-selected' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {editingLabel ? (
            <input
              className="connection-label-input"
              value={draft}
              autoFocus
              placeholder="Label"
              size={Math.max(draft.length, 6)}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitLabel();
                if (e.key === 'Escape') setEditingLabel(false);
                e.stopPropagation();
              }}
            />
          ) : (
            label && (
              <button className="connection-label" onClick={startLabelEdit} title="Edit label">
                {label}
              </button>
            )
          )}

          {selected && !editingLabel && (
            <div className="connection-toolbar">
              <button
                title={`Line: ${lineStyle} (click to change)`}
                onClick={() => updateEdge(id, { lineStyle: cycle(LINE_STYLES, lineStyle) })}
              >
                <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden>
                  <line
                    x1="2"
                    y1="8"
                    x2="16"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={lineStyle === 'solid' ? undefined : lineStyle === 'dashed' ? '4 3.5' : '0.5 4'}
                  />
                </svg>
              </button>
              <button
                title={`Direction: ${direction} (click to change)`}
                onClick={() => updateEdge(id, { directionality: cycle(DIRECTIONS, direction) })}
              >
                <DirectionIcon size={16} />
              </button>
              <button title={label ? 'Edit label' : 'Add label'} onClick={startLabelEdit}>
                <Type size={15} />
              </button>
              <span className="connection-toolbar-sep" />
              <button className="is-danger" title="Delete connection (⌫)" onClick={() => deleteEdge(id)}>
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
