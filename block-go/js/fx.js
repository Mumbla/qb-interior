// Full-screen particle layer drawn above the UI.
import { PALETTE } from './render.js';

const canvas = document.getElementById('fx');
const g = canvas.getContext('2d');
let parts = [];
let running = false;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

function loop() {
  g.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.life -= 1 / 60;
    p.vy += p.grav;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    const a = Math.max(0, Math.min(1, p.life / p.max));
    g.save();
    g.globalAlpha = a;
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    if (p.kind === 'star') {
      g.fillStyle = p.color;
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 ? p.size * 0.45 : p.size;
        const ang = (i / 10) * Math.PI * 2;
        g.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      g.fill();
    } else {
      const s = p.size * (0.5 + a * 0.5);
      g.fillStyle = p.color;
      g.beginPath();
      g.roundRect(-s / 2, -s / 2, s, s, s * 0.25);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)';
      g.fillRect(-s / 2 + s * 0.15, -s / 2 + s * 0.12, s * 0.5, s * 0.18);
    }
    g.restore();
  }
  if (parts.length) requestAnimationFrame(loop);
  else running = false;
}

function start() {
  if (!running) { running = true; requestAnimationFrame(loop); }
}

export function burst(x, y, color = 'gold', n = 10, power = 5) {
  const col = PALETTE[color]?.[0] || color;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = power * (0.4 + Math.random());
    parts.push({
      x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 2, grav: 0.25,
      size: 6 + Math.random() * 10, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      life: 0.7 + Math.random() * 0.5, max: 1.1, color: col, kind: Math.random() < 0.3 ? 'star' : 'cube',
    });
  }
  start();
}

export function confetti(n = 80) {
  const cols = Object.values(PALETTE).map(p => p[0]);
  for (let i = 0; i < n; i++) {
    parts.push({
      x: Math.random() * innerWidth, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
      grav: 0.06, size: 8 + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      life: 2.5 + Math.random(), max: 3, color: cols[i % cols.length], kind: i % 3 ? 'cube' : 'star',
    });
  }
  start();
}

// Floating text such as "+250" or "COMBO x3".
export function floatText(text, x, y, cls = '') {
  const el = document.createElement('div');
  el.className = 'float-text ' + cls;
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// Flies small coin icons from a point to the coin counter.
export function coinFly(x, y, n = 6, target = '#hud-coins .icon') {
  const t = document.querySelector(target)?.getBoundingClientRect();
  if (!t) return;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'coin-fly';
    el.style.left = x + (Math.random() - 0.5) * 60 + 'px';
    el.style.top = y + (Math.random() - 0.5) * 40 + 'px';
    document.body.appendChild(el);
    const dx = t.left + t.width / 2 - parseFloat(el.style.left);
    const dy = t.top + t.height / 2 - parseFloat(el.style.top);
    el.animate(
      [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0.6 }],
      { duration: 600 + i * 70, easing: 'cubic-bezier(.5,-0.3,.7,1)', fill: 'forwards' },
    ).onfinish = () => el.remove();
  }
}

export function shake(el, amt = 6) {
  el.animate(
    [0, 1, 2, 3, 4].map(i => ({ transform: i === 4 ? 'none' : `translate(${(Math.random() - 0.5) * amt}px,${(Math.random() - 0.5) * amt}px)` })),
    { duration: 260 },
  );
}
