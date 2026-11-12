import { useEffect, useRef, useState } from 'react';
import { useStore, useStoreApi } from 'reactflow';
import { Volume2, VolumeX } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { useSettingsStore } from '../store/settingsStore';
import { countWords } from '../utils/wordCount';
import { World, RANK_AT, rankOf, worldOf } from './worlds';
import { TERRAIN, CLOUD } from './sprites';
import { game } from './game';
import './game.css';

/** Ground (or sky) that pans and zooms with the notes, so the board feels like a place. */
export function Terrain({ world }: { world: World }) {
  const [x, y, zoom] = useStore((s) => s.transform);
  return (
    <>
      {TERRAIN[world.id].map((layer, i) => (
        <div
          key={i}
          className={`terrain-layer ${layer.className ?? ''}`}
          style={{
            backgroundImage: layer.image,
            backgroundSize: `${layer.size * (1 + (zoom - 1) * layer.depth)}px`,
            backgroundPosition: `${x * layer.depth}px ${y * layer.depth}px`,
          }}
        />
      ))}
      {world.id === 'space' ? (
        <>
          <i className="shooting-star" />
          <i className="shooting-star shooting-star--b" />
        </>
      ) : (
        [0, 1, 2, 3].map((i) => <i key={i} className={`cloud cloud--${i}`} style={{ backgroundImage: CLOUD }} />)
      )}
    </>
  );
}

/** Scoreboard for the whole board, plus the reactions to building and demolishing. */
export function Hud() {
  const world = worldOf(useSettingsStore((s) => s.theme));
  const sound = useSettingsStore((s) => s.sound);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const flow = useStoreApi();
  const [banner, setBanner] = useState<number | null>(null);

  const words = nodes.reduce((sum, n) => sum + (n.data?.wordCount ?? countWords(n.data?.body ?? '')), 0);
  const score = words + 10 * nodes.length + 10 * edges.length;
  const rank = rankOf(score);
  const lastRank = useRef(rank.index);

  useEffect(() => {
    const grew = rank.index > lastRank.current;
    lastRank.current = rank.index;
    if (!grew || !world) return;
    setBanner(rank.index);
    game.rankUp();
    const timer = setTimeout(() => setBanner(null), 3400);
    return () => clearTimeout(timer);
  }, [rank.index, world]);

  useEffect(
    () =>
      useCanvasStore.subscribe((now, before) => {
        if (now.edges.length > before.edges.length) game.connect();
        if (now.nodes.length < before.nodes.length) {
          const [x, y, zoom] = flow.getState().transform;
          before.nodes
            .filter((n) => !now.nodes.some((m) => m.id === n.id))
            .forEach((n) =>
              game.demolish(
                (n.position.x + (n.width ?? 0) / 2) * zoom + x,
                (n.position.y + (n.height ?? 0) / 2) * zoom + y
              )
            );
        }
      }),
    [flow]
  );

  if (!world) return null;

  return (
    <>
      <div className="hud">
        <div className="hud-top">
          <span className="hud-rank">{world.ranks[rank.index]}</span>
          <button
            className="hud-sound"
            onClick={() => useSettingsStore.getState().toggleSound()}
            title={sound ? 'Sound on' : 'Sound off'}
            aria-label={sound ? 'Turn sound off' : 'Turn sound on'}
          >
            {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
        <div className="hud-bar">
          <i style={{ width: `${rank.progress * 100}%` }} />
        </div>
        <div className="hud-next">
          {rank.next ? `${RANK_AT[rank.index + 1] - score} to ${world.ranks[rank.index + 1]}` : 'Top rank reached'}
        </div>
        <div className="hud-stats">
          <span>
            <b>{nodes.length}</b> {world.nouns.notes}
          </span>
          <span>
            <b>{edges.length}</b> {world.nouns.links}
          </span>
          <span>
            <b>{words}</b> {world.nouns.words}
          </span>
        </div>
      </div>

      {banner !== null && (
        <div className="rank-banner" key={banner} role="status">
          <small>Your {world.ranks[banner - 1].toLowerCase()} grew into a</small>
          <strong>{world.ranks[banner]}</strong>
        </div>
      )}
    </>
  );
}
