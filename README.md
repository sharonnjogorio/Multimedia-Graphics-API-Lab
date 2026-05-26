# Giffy and the Mango Tree
### An Interactive HTML5 Canvas Storybook

A 4-page animated storybook built exclusively with **HTML5 Canvas**, **CSS**, and **vanilla JavaScript** — no frameworks or libraries.

**Live demo:** https://sharonnjogorio.github.io/Multimedia-Graphics-API-Lab/

---

## Assignment Requirements

| Requirement | How it is met |
|---|---|
| HTML5 Canvas + CSS + JavaScript only | `index.html`, `style.css`, `script.js` — zero external libraries |
| Application stage clearly commented | `[STAGE 1]` section banner + inline marker in the animation loop |
| Geometry stage clearly commented | `[STAGE 2]` section banner + inline marker in the animation loop |
| Rasterization stage clearly commented | `[STAGE 3]` section banner + inline marker in the animation loop |
| At least 2 distinct objects | Giraffe, mango tree, sun, two clouds, butterfly, falling mango, grass blades |

---

## Graphics Pipeline

Each animation frame passes through three clearly labelled stages in `script.js`:

### [STAGE 1] — Application Stage
CPU-side logic only. Reads button clicks, advances the global timer, tracks which story page is active, and updates the mango-fall progress value. No canvas drawing occurs here.

### [STAGE 2] — Geometry Stage
`computeFrameGeometry()` computes every position, rotation, and scale value for the current frame using trigonometry and parametric equations:
- **Sun** — sinusoidal vertical bob
- **Clouds** — linear drift with modular wrap-around
- **Giraffe** — triangle-wave walk cycle, tail wag, and vertical bounce
- **Mango** — ease-in parabolic fall (quadratic easing)
- **Butterfly** — Lissajous figure-8 path with wing-flap rotation
- **Tree leaves** — breathing scale pulse
- **Grass** — per-blade sway offset

No canvas drawing occurs here.

### [STAGE 3] — Rasterization Stage
Each `draw*()` function converts the geometry object into pixels on the `<canvas>` using `ctx.fill()`, `ctx.stroke()`, linear gradients, and radial gradients.

---

## Scene Objects

| Object | Animation |
|---|---|
| **Giraffe** (Giffy) | Walks left and right, tail wags, smiles on final page |
| **Mango tree** | Leaves gently breathe in and out |
| **Sun** | Slow vertical bob with radial gradient halo |
| **Clouds** (×2) | Drift across the sky at different speeds |
| **Butterfly** | Figure-8 (Lissajous) flight path with flapping wings |
| **Falling mango** | Drops with ease-in gravity on page 3, rests on ground on page 4 |
| **Grass blades** (×14) | Individual sway using phase-offset sine waves |

---

## How to Run Locally

1. Clone the repository
   ```
   git clone https://github.com/sharonnjogorio/Multimedia-Graphics-API-Lab.git
   ```
2. Open `index.html` in any modern browser — no build step required.

---

## How to Enable GitHub Pages

1. Go to **Settings → Pages** in the repository
2. Under **Source**, select **Deploy from a branch**
3. Choose **main** branch, **/ (root)** folder
4. Click **Save** — the live link will appear within a minute

---

## File Structure

```
Multimedia-Graphics-API-Lab/
├── index.html   — page structure and canvas elements
├── style.css    — layout, typography, pastel orange theme
└── script.js    — all animation logic (pipeline stages 1–3)
```
