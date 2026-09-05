# Gödel spacetime (1949)

Interactive browser visualization of Kurt Gödel’s 1949 rotating-dust universe: a central time/rotation axis, concentric radii, tipping light cones, co-rotating dust worldlines, and a closed timelike curve (CTC) outside a critical radius.

**Live site:** [https://drewarrowood.github.io/godel-spacetime/](https://drewarrowood.github.io/godel-spacetime/)

This is an educational Three.js scene (orbit / pan / zoom). It is **not** a numerical geodesic integrator. Cone tilt follows the illustrative law

`θ(r) ≈ (π/2) · (1 − exp(−r / r_crit))`

with `r_crit ≈ 2` in arbitrary units. Blue cones mark `r < r_crit`; orange/red cones mark `r ≥ r_crit`, where the azimuthal direction φ can become timelike. The magenta ring is a schematic CTC at `r > r_crit`.

## Local

The page loads Three.js from a CDN via an import map, so it must be served over HTTP (opening `index.html` as `file://` will fail).

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080/](http://localhost:8080/).

Any other static server works (`npx serve`, VS Code Live Server, etc.).

## Controls

- **Orbit:** drag (one-finger on touch)
- **Zoom:** scroll or pinch
- **Pan:** right-drag or two-finger drag
- **Reset view:** button in the on-page legend

## GitHub Pages

Live at [https://drewarrowood.github.io/godel-spacetime/](https://drewarrowood.github.io/godel-spacetime/).

The viewer is static files at the repository root (`index.html`, `main.js`, `style.css`, `.nojekyll`). Pages is set to **Deploy from a branch**: `main` / `/ (root)`.

## Attribution

Visualization of the causal picture associated with the Gödel metric (Gödel, 1949). Geometry, colors, and the tip/CTC layout are illustrative for teaching; they do not solve the geodesic equation or claim coordinate-invariant numerical accuracy.
