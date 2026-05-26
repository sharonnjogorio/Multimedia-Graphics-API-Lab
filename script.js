/* [STAGE 1] APPLICATION STAGE — globals, state, input handling*/

const stage = document.getElementById('stage');
const ctx   = stage.getContext('2d');

const prevBtn   = document.getElementById('prev');
const nextBtn   = document.getElementById('next');
const listenBtn = document.getElementById('listen');
const captionEl = document.getElementById('caption-text');
const pageNumEl = document.getElementById('page-num');
const pageTotEl = document.getElementById('page-total');

const W = stage.width;
const H = stage.height;

const STORY = [
  {
    text: "Once upon a time, near a tall mango tree, there lived a tall giraffe named Giffy.",
    scene: { showButterfly: false, mangoFalling: false, mangoOnGround: false, goatHappy: false }
  },
  {
    text: "Every morning, the warm sun would peek out to say hello and a butterfly came to dance through the leaves.",
    scene: { showButterfly: true,  mangoFalling: false, mangoOnGround: false, goatHappy: false }
  },
  {
    text: "One sunny afternoon, a ripe mango let go of its branch and fell with a soft thud. Plop!",
    scene: { showButterfly: true,  mangoFalling: true,  mangoOnGround: false, goatHappy: false }
  },
  {
    text: "Giffy smiled, ate the sweet mango and listened to the wind in the leaves.  The end.",
    scene: { showButterfly: true,  mangoFalling: false, mangoOnGround: true,  goatHappy: true  }
  }
];

const state = {
  pageIndex: 0,
  startTime: performance.now(),
  time:      0,
  pageTime:  0,
  pageStart: performance.now(),
  mangoT:    0
};

pageTotEl.textContent = STORY.length;

function goToPage(i) {
  state.pageIndex = Math.max(0, Math.min(STORY.length - 1, i));
  state.pageStart = performance.now();
  state.mangoT    = 0;
  captionEl.textContent = STORY[state.pageIndex].text;
  pageNumEl.textContent = state.pageIndex + 1;
  prevBtn.disabled = state.pageIndex === 0;
  nextBtn.disabled = state.pageIndex === STORY.length - 1;
}

prevBtn.addEventListener('click', () => goToPage(state.pageIndex - 1));
nextBtn.addEventListener('click', () => goToPage(state.pageIndex + 1));

listenBtn.addEventListener('click', () => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(STORY[state.pageIndex].text);
  utter.rate   = 0.9;
  utter.pitch  = 1.05;
  utter.volume = 1.0;
  window.speechSynthesis.speak(utter);
});

goToPage(0);


/* [STAGE 2] GEOMETRY STAGE — pure math, no drawing
   computeFrameGeometry() returns every position, rotation and scale
   needed to draw this frame.*/

function computeFrameGeometry() {
  const t     = state.time;
  const pageT = state.pageTime;
  const scene = STORY[state.pageIndex].scene;

  const sun = {
    x: 760,
    y: 100 + Math.sin(t * 0.6) * 4,
    r: 46
  };

  const cloud1 = { x: ((120 + t * 12) % (W + 200)) - 100, y: 90,  s: 1.0 };
  const cloud2 = { x: ((520 + t * 9 ) % (W + 200)) - 100, y: 140, s: 0.8 };

  const range     = 140;
  const speed     = 0.35;
  const phase     = (t * speed) % 2;
  const tri       = phase < 1 ? phase : 2 - phase;
  const giraX     = 240 + tri * range;
  const facing    = phase < 1 ? 1 : -1;
  const tailAngle = Math.sin(t * 6) * 0.35;
  const giraY     = 360 - Math.abs(Math.sin(t * 6)) * 2;

  const giraffe = { x: giraX, y: giraY, facing, tailAngle, happy: scene.goatHappy };

  const leafBreath = 1 + Math.sin(t * 1.2) * 0.015;
  const tree = { x: 560, y: 380, leafScale: leafBreath };

  let mango = null;
  if (scene.mangoFalling) {
    state.mangoT = Math.min(1, pageT / 1.8);
    const ease   = state.mangoT * state.mangoT;
    mango = {
      x:   560 + Math.sin(state.mangoT * 8) * 3,
      y:   210 + (430 - 210) * ease,
      r:   12,
      rot: state.mangoT * Math.PI * 1.5
    };
  } else if (scene.mangoOnGround) {
    mango = { x: 528, y: 432, r: 12, rot: 0.4, onGround: true };
  }

  let butterfly = null;
  if (scene.showButterfly) {
    butterfly = {
      x:    460 + Math.sin(t * 0.9) * 110,
      y:    220 + Math.sin(t * 1.8) * 40,
      wing: Math.sin(t * 14) * 0.8
    };
  }

  const grass = [];
  for (let i = 0; i < 14; i++) {
    grass.push({ x: 60 + i * 60, sway: Math.sin(t * 1.5 + i * 0.6) * 0.12 });
  }

  return { sun, cloud1, cloud2, giraffe, tree, mango, butterfly, grass };
}


/* [STAGE 3] RASTERIZATION STAGE — drawing functions
   These convert geometry into coloured pixels on the canvas.*/

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   '#dceaf0');
  grad.addColorStop(0.6, '#eef0db');
  grad.addColorStop(1,   '#cfdbb0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawGround() {
  const grad = ctx.createLinearGradient(0, 420, 0, H);
  grad.addColorStop(0, '#aac779');
  grad.addColorStop(1, '#7da257');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 420, W, H - 420);
  ctx.strokeStyle = 'rgba(58,42,30,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 420); ctx.lineTo(W, 420);
  ctx.stroke();
}

function drawSun(s) {
  const halo = ctx.createRadialGradient(s.x, s.y, s.r * 0.7, s.x, s.y, s.r * 2.2);
  halo.addColorStop(0, 'rgba(255,220,140,0.55)');
  halo.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.2, 0, Math.PI * 2); ctx.fill();

  const body = ctx.createRadialGradient(s.x - 8, s.y - 8, 4, s.x, s.y, s.r);
  body.addColorStop(0, '#fff3c4');
  body.addColorStop(1, '#f5c466');
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
}

function drawCloud(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.s, c.s);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(0,  0,  22, 0, Math.PI * 2);
  ctx.arc(28, -6, 26, 0, Math.PI * 2);
  ctx.arc(58,  0, 22, 0, Math.PI * 2);
  ctx.arc(38, 12, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(tree) {
  ctx.fillStyle = '#8a5a3b';
  ctx.beginPath();
  ctx.moveTo(tree.x - 14, tree.y + 40);
  ctx.lineTo(tree.x - 10, tree.y - 80);
  ctx.lineTo(tree.x + 10, tree.y - 80);
  ctx.lineTo(tree.x + 14, tree.y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,42,30,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.translate(tree.x, tree.y - 100);
  ctx.scale(tree.leafScale, tree.leafScale);
  for (const f of [
    { x:   0, y: -40, r: 70, c: '#7ea75a' },
    { x: -50, y: -10, r: 55, c: '#8eb968' },
    { x:  50, y: -10, r: 55, c: '#6f9750' },
    { x:   0, y:  20, r: 60, c: '#85b061' },
  ]) {
    ctx.fillStyle = f.c;
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#e88a3a';
  for (const m of [[-30,-20],[20,-30],[40,10],[-10,30]]) {
    ctx.beginPath(); ctx.ellipse(m[0], m[1], 8, 10, 0.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawMango(m) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.rot || 0);

  if (m.onGround) {
    ctx.fillStyle = 'rgba(58,42,30,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 12, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  }

  const g = ctx.createRadialGradient(-3, -4, 2, 0, 0, m.r + 4);
  g.addColorStop(0, '#ffcf73');
  g.addColorStop(1, '#c8631e');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, m.r, m.r + 2, 0, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#5a4a30';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, -m.r - 2); ctx.lineTo(2, -m.r - 6); ctx.stroke();

  ctx.restore();
}

function drawGiraffe(g) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.scale(g.facing, 1);

  const TAN   = '#e2bc6a';
  const LIGHT = '#f2d898';
  const SPOT  = '#8b4f1e';
  const DARK  = '#3a2a1e';

  ctx.fillStyle = TAN;
  ctx.fillRect(-26, 0, 7, 54);
  ctx.fillRect(-16, 0, 7, 54);
  ctx.fillRect( 10, 0, 7, 54);
  ctx.fillRect( 20, 0, 7, 54);

  ctx.fillStyle = DARK;
  for (const lx of [-27, -17, 9, 19]) { ctx.fillRect(lx, 50, 9, 6); }

  ctx.save();
  ctx.translate(-30, -8);
  ctx.rotate(g.tailAngle * 0.4);
  ctx.strokeStyle = TAN; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, 16, -2, 28); ctx.stroke();
  ctx.fillStyle = SPOT;
  ctx.beginPath(); ctx.arc(-2, 30, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = TAN;
  ctx.beginPath(); ctx.ellipse(0, -16, 38, 23, 0, 0, Math.PI * 2); ctx.fill();

  ctx.beginPath();
  ctx.moveTo(14, -30); ctx.lineTo(32, -30);
  ctx.lineTo(46, -100); ctx.lineTo(28, -100);
  ctx.closePath(); ctx.fill();

  // ---- Body spots: irregular polygons, clipped to the body shape ----
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -16, 38, 23, 0, 0, Math.PI * 2);
  ctx.clip();                              // spots can't escape the body outline
  ctx.fillStyle = SPOT;
  const bodySpots = [
    [-24, -18, 6], [-14,  -8, 7], [ -4, -22, 5],
    [  6,  -6, 7], [ 18, -20, 6], [ 26,  -8, 5],
    [-22,   2, 5], [ -8,   4, 5], [ 14,   6, 4]
  ];
  for (let i = 0; i < bodySpots.length; i++) {
    const [cx, cy, r] = bodySpots[i];
    ctx.beginPath();
    // 7-sided polygon with a sinusoidal "wobble" on each vertex — gives the
    // jagged, hand-drawn look of real giraffe patches.
    for (let j = 0; j < 7; j++) {
      const ang = (j / 7) * Math.PI * 2;
      const wob = 0.75 + ((Math.sin(i * 7 + j * 3) + 1) / 2) * 0.45;
      const x = cx + Math.cos(ang) * r * wob;
      const y = cy + Math.sin(ang) * r * wob;
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ---- Neck spots: smaller polygons, clipped to the neck shape ----
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(14, -30);
  ctx.lineTo(32, -30);
  ctx.lineTo(46, -100);
  ctx.lineTo(28, -100);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = SPOT;
  const neckSpots = [
    [22, -42, 3.5], [30, -55, 3], [34, -70, 3.5],
    [38, -85, 3],   [26, -92, 2.8]
  ];
  for (let i = 0; i < neckSpots.length; i++) {
    const [cx, cy, r] = neckSpots[i];
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const ang = (j / 6) * Math.PI * 2;
      const wob = 0.75 + ((Math.sin(i * 5 + j * 2) + 1) / 2) * 0.4;
      const x = cx + Math.cos(ang) * r * wob;
      const y = cy + Math.sin(ang) * r * wob;
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = TAN;
  ctx.beginPath(); ctx.ellipse(38, -108, 15, 10, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(51, -106,  9,  7, 0.1, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = SPOT; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(32, -117); ctx.lineTo(31, -128); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(42, -118); ctx.lineTo(42, -128); ctx.stroke();
  ctx.fillStyle = SPOT;
  ctx.beginPath(); ctx.arc(31, -128, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(42, -128, 3.5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = TAN;
  ctx.beginPath(); ctx.ellipse(26, -118, 6, 9, -0.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = LIGHT;
  ctx.beginPath(); ctx.ellipse(26, -118, 3, 5.5, -0.35, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = DARK;
  ctx.beginPath(); ctx.arc(50, -109, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(51, -110, 1, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(58,42,30,0.3)';
  ctx.beginPath(); ctx.ellipse(57, -103, 2.2, 1.6, 0.3, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = DARK; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath();
  if (g.happy) { ctx.arc(55, -100, 3, 0, Math.PI); }
  else         { ctx.moveTo(53, -100); ctx.lineTo(58, -100); }
  ctx.stroke();

  ctx.restore();
}

function drawButterfly(b) {
  ctx.save();
  ctx.translate(b.x, b.y);

  ctx.fillStyle = '#3a2a1e';
  ctx.fillRect(-1, -6, 2, 12);

  const wingScale = 0.6 + Math.abs(b.wing) * 0.5;
  ctx.fillStyle = '#c46a3f';

  ctx.save();
  ctx.scale(wingScale, 1);
  ctx.beginPath(); ctx.ellipse(-7, -3, 7, 5,  0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-6,  4, 5, 4, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.scale(wingScale, 1);
  ctx.beginPath(); ctx.ellipse(7, -3, 7, 5, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6,  4, 5, 4,  0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawGrass(blades) {
  ctx.strokeStyle = '#5e8540';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const b of blades) {
    ctx.save();
    ctx.translate(b.x, 430);
    ctx.rotate(b.sway);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke();
    ctx.restore();
  }
}

function drawScene(geo) {
  /* [STAGE 3] RASTERIZATION STAGE — convert geometry into pixels */
  drawSky();
  drawGround();
  drawSun(geo.sun);
  drawCloud(geo.cloud1);
  drawCloud(geo.cloud2);
  drawTree(geo.tree);
  if (geo.mango)     drawMango(geo.mango);
  drawGiraffe(geo.giraffe);
  if (geo.butterfly) drawButterfly(geo.butterfly);
  drawGrass(geo.grass);
}

function loop(timestamp) {
  /* [STAGE 1] APPLICATION STAGE — advance timers, no drawing */
  state.time     = (timestamp - state.startTime) / 1000;
  state.pageTime = (timestamp - state.pageStart)  / 1000;

  /* [STAGE 2] GEOMETRY STAGE — compute positions / rotations, no drawing */
  const geo = computeFrameGeometry();

  /* [STAGE 3] RASTERIZATION STAGE — draw to canvas pixels */
  drawScene(geo);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);