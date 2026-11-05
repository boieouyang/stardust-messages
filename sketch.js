// Stardust Messages — a remix of "Print Dust" by Ivan Rudnicki
//  - ANY KEY: dust quickly gathers into a random message in gold leaf and stays
//  - CLICK: dust bursts out from the click and scatters back into a cloud
//  - SPACE: night (black + white dust) <-> day (cream + red/green dust)
//  - slow mouse: dust gently follows · fast mouse: dust is pushed and flung
//  - moving dust turns to shimmering gold leaf

const NUM = 6000;      // number of dust particles (reduce if lagging)
const SPRING = 0.22;   // how fast dust flies to its target (higher = faster)
const DAMP = 0.72;     // friction (lower = settles faster)

const QUOTES = [
  "Small steps still move you forward.",
  "You are allowed to start again.",
  "Be gentle with yourself today.",
  "Curiosity is a kind of courage.",
  "Every star was once dust.",
  "Done is better than perfect.",
  "Slow is still progress.",
  "You've already come so far.",
  "Rest is part of the work.",
  "Your pace is the right pace.",
  "Tiny light still counts.",
  "Keep going. You're doing fine."
];

// gold leaf tones: from pale highlight to deep bronze
const LEAF_NIGHT = [
  [255, 247, 220],
  [242, 214, 140],
  [214, 172, 82],
  [176, 130, 50],
  [130, 92, 34]
];
const LEAF_DAY = [
  [214, 172, 82],
  [190, 145, 60],
  [160, 116, 42],
  [128, 88, 30],
  [96, 64, 22]
];

let dust = [];
let sparks = [];
let night = true;
let quoteMode = false;
let lastQuote = '';
let mouseSpeed = 0, mvx = 0, mvy = 0;

const NIGHT_BG = [6, 6, 8];
const DAY_BG = [250, 244, 230];
const WHITE = [235, 235, 240];
const RED = [224, 71, 76];
const GREEN = [96, 168, 80];

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  makeDust();
}

function makeDust() {
  dust = [];
  for (let i = 0; i < NUM; i++) {
    const p = cloudPoint();
    dust.push({
      x: p.x, y: p.y, vx: 0, vy: 0,
      tx: p.x, ty: p.y,
      hx: p.x, hy: p.y,
      red: random() < 0.5,
      q: false,
      tone: random(),
      phase: random(TWO_PI),
      rate: random(1.5, 4)
    });
  }
}

function cloudPoint() {
  const a = random(TWO_PI);
  const r = sqrt(random()) * min(width, height) * 0.45;
  return { x: width / 2 + cos(a) * r, y: height / 2 + sin(a) * r };
}

function goldLeaf(d, time, boost) {
  const pal = night ? LEAF_NIGHT : LEAF_DAY;
  const s = pow(max(0, sin(time * d.rate + d.phase)), 8);
  let pos = d.tone - s * 0.9 - boost * 0.5;
  pos = constrain(pos, 0, 1) * (pal.length - 1);
  const i = floor(pos), f = pos - i;
  const a = pal[i], b = pal[min(i + 1, pal.length - 1)];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}

function draw() {
  background(...(night ? NIGHT_BG : DAY_BG));
  if (night) blendMode(ADD);
  measureMouse();
  const time = millis() / 1000;
  const t = millis() * 0.0004;
  const R = 90;
  const SLOW = 3;

  for (const d of dust) {
    let tx = d.tx, ty = d.ty;
    if (!d.q) {
      tx += (noise(d.hx * 0.01, t) - 0.5) * 30;
      ty += (noise(d.hy * 0.01, t + 9) - 0.5) * 30;
    }
    d.vx += (tx - d.x) * SPRING;
    d.vy += (ty - d.y) * SPRING;

    const ax = d.x - mouseX, ay = d.y - mouseY;
    const dist2 = ax * ax + ay * ay;
    if (dist2 > 0.1 && dist2 < R * R) {
      const dd = sqrt(dist2);
      const falloff = 1 - dd / R;
      if (mouseSpeed < SLOW) {
        d.vx -= (ax / dd) * 1.2 * falloff;
        d.vy -= (ay / dd) * 1.2 * falloff;
      } else {
        const power = constrain(map(mouseSpeed, SLOW, 40, 0.5, 3), 0.5, 3);
        d.vx += (ax / dd) * 8 * power * falloff + mvx * 0.6 * falloff;
        d.vy += (ay / dd) * 8 * power * falloff + mvy * 0.6 * falloff;
      }
    }

    d.vx *= DAMP;
    d.vy *= DAMP;
    d.x += d.vx;
    d.y += d.vy;

    const speed = sqrt(d.vx * d.vx + d.vy * d.vy);
    const glow = constrain(speed / 4, 0, 1);
    let c, alpha, w;
    if (d.q) {
      c = goldLeaf(d, time, glow);
      alpha = 255;
      w = 2.6;
    } else {
      const base = night ? WHITE : (d.red ? RED : GREEN);
      const leaf = goldLeaf(d, time, glow);
      c = [
        lerp(base[0], leaf[0], glow),
        lerp(base[1], leaf[1], glow),
        lerp(base[2], leaf[2], glow)
      ];
      alpha = quoteMode ? 45 : (night ? 150 : 255);
      w = 2 + glow * 1.5;
    }
    stroke(c[0], c[1], c[2], alpha);
    strokeWeight(w);
    point(d.x, d.y);
  }

  drawSparks(time);
  blendMode(BLEND);

  noStroke();
  fill(night ? 255 : 60, 120);
  textAlign(CENTER, CENTER);
  textSize(13);
  text('any key: a message  ·  click: scatter  ·  space: day/night',
    width / 2, height - 22);
}

function measureMouse() {
  const dx = mouseX - pmouseX, dy = mouseY - pmouseY;
  mouseSpeed = lerp(mouseSpeed, sqrt(dx * dx + dy * dy), 0.3);
  mvx = lerp(mvx, dx, 0.3);
  mvy = lerp(mvy, dy, 0.3);
}

function keyPressed() {
  if (key === ' ') {
    night = !night;
    return false;
  }
  if (key.length === 1) showQuote();
}

// on phones: tap = message when idle, scatter when a message is showing
function touchStarted() {
  if (quoteMode) mousePressed();
  else showQuote();
  return false;
}

function showQuote() {
  let q = random(QUOTES);
  while (q === lastQuote && QUOTES.length > 1) q = random(QUOTES);
  lastQuote = q;

  const pts = shuffle(textTargets(q));
  const order = shuffle([...dust]);
  const n = min(pts.length, floor(order.length * 0.8));

  order.forEach((d, i) => {
    if (i < n) {
      d.q = true;
      d.tx = pts[i].x;
      d.ty = pts[i].y;
    } else {
      d.q = false;
      const a = atan2(d.hy - height / 2, d.hx - width / 2);
      const r = random(0.48, 0.7) * max(width, height);
      d.tx = width / 2 + cos(a) * r;
      d.ty = height / 2 + sin(a) * r;
    }
  });
  quoteMode = true;
}

function release() {
  quoteMode = false;
  for (const d of dust) {
    d.q = false;
    d.tx = d.hx;
    d.ty = d.hy;
  }
}

function textTargets(str) {
  const g = createGraphics(width, height);
  g.pixelDensity(1);
  g.background(0);
  g.fill(255);
  g.noStroke();
  g.textStyle(BOLD);
  g.textAlign(CENTER, CENTER);
  g.textWrap(WORD);

  const boxW = width * 0.85, boxH = height * 0.6;
  let size = min(width, height) * 0.14;
  g.textSize(size);
  while (size > 16 && (g.textWidth(str) / boxW + 1) * size * 1.3 > boxH) {
    size -= 2;
    g.textSize(size);
  }
  g.text(str, (width - boxW) / 2, (height - boxH) / 2, boxW, boxH);

  g.loadPixels();
  const pts = [];
  const step = max(3, floor(size / 18));
  for (let y = 0; y < g.height; y += step) {
    for (let x = 0; x < g.width; x += step) {
      if (g.pixels[4 * (y * g.width + x)] > 128) pts.push({ x, y });
    }
  }
  g.remove();
  return pts;
}

function mousePressed() {
  release();

  const B = 220;
  for (const d of dust) {
    const ax = d.x - mouseX, ay = d.y - mouseY;
    const dd = sqrt(ax * ax + ay * ay);
    if (dd > 0.1 && dd < B) {
      const f = 30 * (1 - dd / B);
      d.vx += (ax / dd) * f;
      d.vy += (ay / dd) * f;
    }
  }
  for (let k = 0; k < 160; k++) {
    const a = random(TWO_PI), s = random(2, 9);
    sparks.push({
      x: mouseX, y: mouseY,
      vx: cos(a) * s, vy: sin(a) * s,
      life: 255,
      tone: random(), phase: random(TWO_PI), rate: random(4, 9)
    });
  }
}

function drawSparks(time) {
  for (let k = sparks.length - 1; k >= 0; k--) {
    const s = sparks[k];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.96;
    s.vy = s.vy * 0.96 + 0.06;
    s.life -= 4;
    const c = goldLeaf(s, time, 0.3);
    stroke(c[0], c[1], c[2], s.life);
    strokeWeight(3);
    point(s.x, s.y);
    if (s.life <= 0) sparks.splice(k, 1);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  makeDust();
  quoteMode = false;
}
