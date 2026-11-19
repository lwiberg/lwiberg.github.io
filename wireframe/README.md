# Warped wireframe background

Open `index.html` in a browser, or serve this directory as part of the site. The
prototype is intentionally content-free so the full background is visible.
The vertex and fragment GLSL sources are in `wireframe.js`.

## Integration

1. Copy `wireframe.js` into the site and load it with a deferred script tag.
2. Add `<canvas class="wireframe-background" aria-hidden="true"></canvas>` to
   the body. The script initializes the first canvas with that class.
3. Copy the `.wireframe-background` CSS from `index.html`. Give page content a
   positioned stacking layer above the canvas, as shown by `.page-content`.
   Set the page background to the same color as `backgroundColor` for the
   static fallback.

The canvas is fixed, does not intercept pointer events, and does not affect
document layout. The shader requires no assets or libraries. If WebGL or
shader initialization fails, the page background remains visible. The
animation pauses in hidden tabs; reduced motion renders a still frame and
continues to respond to resizing.

## Configuration

Edit `wireframeConfig` at the top of `wireframe.js`. Positions are viewport
fractions `[x, y]`, measured from the top-left; colors are normalized RGB.
`gridDensity`, `lineThickness`, `vortexPosition`, `vortexDepth`,
`distortionIntensity`, `animationSpeed`, each light's `position` and
`intensity`, `brightness`, and `backgroundColor` control the appearance.
`maxPixelRatio` caps rendering resolution and `framesPerSecond` sets the
maximum target frame rate. Use positive values for density, pixel ratio, and
frame rate. Changing the background color also requires updating the CSS
fallback.
