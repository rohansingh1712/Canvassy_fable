/** Short-lived particles and floating text, drawn straight into a fixed overlay. */

let layer: HTMLDivElement | null = null;

function getLayer() {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'fx-layer';
    document.body.appendChild(layer);
  }
  return layer;
}

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function burst(x: number, y: number, colors: string[], count = 12, power = 60) {
  if (calm()) return;
  const host = getLayer();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.className = 'fx-p';
    const size = 4 + Math.floor(Math.random() * 3) * 2;
    el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]}`;
    host.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    const reach = power * (0.4 + Math.random() * 0.6);
    const dx = Math.cos(angle) * reach;
    const dy = Math.sin(angle) * reach - power * 0.4;
    el.animate(
      [
        { transform: 'translate(-50%,-50%)', opacity: 1 },
        { transform: `translate(${dx * 0.7}px,${dy}px)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px,${dy + power * 0.9}px)`, opacity: 0 },
      ],
      { duration: 550 + Math.random() * 350, easing: 'steps(9)' }
    ).onfinish = () => el.remove();
  }
}

export function floatText(x: number, y: number, text: string, big = false) {
  const el = document.createElement('span');
  el.className = `fx-text${big ? ' fx-text--big' : ''}`;
  el.textContent = text;
  el.style.cssText = `left:${x}px;top:${y}px`;
  getLayer().appendChild(el);
  el.animate(
    [
      { transform: 'translate(-50%,0) scale(0.6)', opacity: 0 },
      { transform: 'translate(-50%,-14px) scale(1)', opacity: 1, offset: 0.2 },
      { transform: `translate(-50%,-${big ? 64 : 40}px) scale(1)`, opacity: 1, offset: 0.75 },
      { transform: `translate(-50%,-${big ? 76 : 48}px) scale(1)`, opacity: 0 },
    ],
    { duration: big ? 1500 : 800, easing: 'ease-out' }
  ).onfinish = () => el.remove();
}
