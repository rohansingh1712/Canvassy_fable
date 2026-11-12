import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  OnConnectStartParams,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore, loadViewport, saveViewport } from '../../store/canvasStore';
import { useSettingsStore, CARD_WIDTHS } from '../../store/settingsStore';
import { Card } from '../Card/Card';
import { Connection } from '../Connection/Connection';
import { Backdrop } from '../Backdrop/Backdrop';
import { Dock } from '../Dock/Dock';
import { Toast } from '../Dock/Toast';
import { SettingsPanel } from '../Settings/SettingsPanel';
import { Hud } from '../../game/World';
import { game } from '../../game/game';
import { worldOf } from '../../game/worlds';
import './Canvas.css';

const nodeTypes = { customCard: Card };
const edgeTypes = { default: Connection };
const initialViewport = loadViewport();

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

function CanvasContent() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const isConnecting = useCanvasStore((s) => s.isConnecting);
  const { addCard, connectNodes, onNodesChange, onEdgesChange, onConnect, setConnecting, snapshot } =
    useCanvasStore.getState();
  const cardWidth = useSettingsStore((s) => s.cardWidth);
  const world = worldOf(useSettingsStore((s) => s.theme));
  const { screenToFlowPosition, fitView, zoomTo, getZoom } = useReactFlow();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // True while a note is dragged or the view is panned/zoomed; vibes react to it.
  const [moving, setMoving] = useState(false);
  const connectStart = useRef<OnConnectStartParams | null>(null);
  const didConnect = useRef(false);
  const width = CARD_WIDTHS[cardWidth].full;

  const addCardAtScreenPoint = useCallback(
    (clientX: number, clientY: number) => {
      // Centre the note under the pointer, but keep it fully on screen.
      const onScreen = width * getZoom();
      const left = Math.max(16, Math.min(clientX - onScreen / 2, window.innerWidth - onScreen - 16));
      const top = Math.max(16, clientY - 40 * getZoom());
      addCard(screenToFlowPosition({ x: left, y: top }));
    },
    [screenToFlowPosition, getZoom, addCard, width]
  );

  // Keyboard shortcuts (ignored while typing in a note or field)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('.card-editor-overlay')) return;
      const mod = e.metaKey || e.ctrlKey;

      if (isTyping(e.target)) return;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) useCanvasStore.getState().redo();
        else useCanvasStore.getState().undo();
        return;
      }
      if (mod || e.altKey) return;

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          addCardAtScreenPoint(window.innerWidth / 2, window.innerHeight / 2 - 60);
          break;
        case 'Backspace':
        case 'Delete':
          if (useCanvasStore.getState().deleteSelected()) e.preventDefault();
          break;
        case 's':
        case 'S':
          useSettingsStore.getState().toggleSummaries();
          break;
        case 't':
        case 'T':
          useSettingsStore.getState().cycleTheme();
          break;
        case '1':
          fitView({ duration: 300, padding: 0.2, maxZoom: 1 });
          break;
        case '0':
          zoomTo(1, { duration: 300 });
          break;
        case '?':
          setHelpOpen((open) => !open);
          break;
        case 'Escape':
          setSettingsOpen(false);
          setHelpOpen(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addCardAtScreenPoint, fitView, zoomTo]);

  const handleDoubleClick = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).classList.contains('react-flow__pane')) {
      addCardAtScreenPoint(event.clientX, event.clientY);
    }
  };

  // Dropping a line on a card connects to it; dropping on empty canvas creates a linked note there.
  const handleConnectEnd = (event: MouseEvent | TouchEvent) => {
    const start = connectStart.current;
    connectStart.current = null;
    setConnecting(false);
    if (didConnect.current || !start?.nodeId) return;

    const point = 'changedTouches' in event ? event.changedTouches[0] : event;
    const target = document.elementFromPoint(point.clientX, point.clientY) as HTMLElement | null;
    if (!target) return;

    const nodeEl = target.closest('.react-flow__node');
    if (nodeEl) {
      const targetId = nodeEl.getAttribute('data-id');
      if (targetId) connectNodes(start.nodeId, targetId);
      return;
    }

    if (target.classList.contains('react-flow__pane')) {
      const drop = screenToFlowPosition({ x: point.clientX, y: point.clientY });
      const offset: Record<string, { x: number; y: number }> = {
        right: { x: 0, y: -40 },
        left: { x: -width, y: -40 },
        bottom: { x: -width / 2, y: 0 },
        top: { x: -width / 2, y: -110 },
      };
      const by = offset[start.handleId ?? 'right'] ?? offset.right;
      addCard({ x: drop.x + by.x, y: drop.y + by.y }, { linkFrom: start.nodeId });
    }
  };

  return (
    <div className={`canvas-wrapper${isConnecting ? ' is-connecting' : ''}`} onDoubleClick={handleDoubleClick}>
      <Backdrop moving={moving} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) => {
          didConnect.current = true;
          onConnect(connection);
        }}
        onConnectStart={(_event, params) => {
          connectStart.current = params;
          didConnect.current = false;
          setConnecting(true);
        }}
        onConnectEnd={handleConnectEnd}
        onNodeDragStart={() => {
          snapshot();
          (document.activeElement as HTMLElement | null)?.blur?.();
          setMoving(true);
        }}
        onNodeDragStop={(_event, node) => {
          setMoving(false);
          game.drop(document.querySelector<HTMLElement>(`.react-flow__node[data-id="${node.id}"] .card`));
        }}
        onMoveStart={(event) => event && setMoving(true)}
        onMoveEnd={(_event, viewport) => {
          saveViewport(viewport);
          setMoving(false);
        }}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.Bezier}
        connectionRadius={30}
        defaultViewport={initialViewport ?? { x: 0, y: 0, zoom: 1 }}
        fitView={!initialViewport}
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.15}
        maxZoom={2.5}
        panOnScroll
        panOnDrag
        zoomOnPinch
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        nodeDragThreshold={3}
        selectionKeyCode="Shift"
        multiSelectionKeyCode={['Meta', 'Shift']}
        deleteKeyCode={null}
        selectNodesOnDrag={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1.6} />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="canvas-empty">
          <p className="canvas-empty-title">{world ? world.empty[0] : 'A blank canvas'}</p>
          <p>{world ? world.empty[1] : 'Double-click anywhere to drop your first note.'}</p>
        </div>
      )}

      <Dock
        onNewCard={() => addCardAtScreenPoint(window.innerWidth / 2, window.innerHeight / 2 - 60)}
        onOpenSettings={() => setSettingsOpen((open) => !open)}
        helpOpen={helpOpen}
        setHelpOpen={setHelpOpen}
      />
      <Hud />
      <Toast />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
}
