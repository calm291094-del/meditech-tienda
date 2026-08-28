// ============================================================
// MAP GENERATOR
// Genera un mapa procedural con ruido Perlin-like.
// Devuelve una matriz de tiles y una lista de recursos.
// ============================================================

window.MapGenerator = {

  width: 64,      // tiles de ancho
  height: 48,     // tiles de alto
  tileSize: 40,   // pixels por tile

  // ----------------------------------------------------------
  // Ruido pseudo-aleatorio determinista
  // ----------------------------------------------------------
  hash(x, y, seed = 1337) {
    let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + seed;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  },

  smoothNoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const a = this.hash(xi,     yi,     seed);
    const b = this.hash(xi + 1, yi,     seed);
    const c = this.hash(xi,     yi + 1, seed);
    const d = this.hash(xi + 1, yi + 1, seed);

    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  },

  fbm(x, y, seed) {
    let total = 0, amp = 1, freq = 1, max = 0;
    for (let i = 0; i < 4; i++) {
      total += this.smoothNoise(x * freq, y * freq, seed + i * 100) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / max;
  },

  // ----------------------------------------------------------
  // Generar mapa completo
  // ----------------------------------------------------------
  generate(seed = Date.now()) {
    const W = this.width, H = this.height;
    const grid = new Uint8Array(W * H);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const e = this.fbm(x * 0.08, y * 0.08, seed);      // elevación
        const m = this.fbm(x * 0.12 + 100, y * 0.12, seed + 1); // humedad

        // Borde del mundo: agua
        const edgeX = Math.min(x, W - 1 - x) / W;
        const edgeY = Math.min(y, H - 1 - y) / H;
        const edge = Math.min(edgeX, edgeY);

        let tile;
        if (edge < 0.06) {
          tile = 0; // agua (borde)
        } else if (e < 0.32) {
          tile = 0; // agua
        } else if (e < 0.38) {
          tile = 1; // arena
        } else if (e > 0.72) {
          tile = this.hash(x * 3, y * 3, seed + 2) > 0.75 ? 5 : 4; // mineral o piedra
        } else if (m > 0.55) {
          tile = 3; // bosque
        } else {
          tile = 2; // hierba
        }

        grid[y * W + x] = tile;
      }
    }

    // Zona central del pueblo: forzar hierba
    const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
    for (let y = cy - 6; y <= cy + 6; y++) {
      for (let x = cx - 6; x <= cx + 6; x++) {
        if (x >= 0 && x < W && y >= 0 && y < H) {
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy <= 36) {
            grid[y * W + x] = 2;
          }
        }
      }
    }

    return grid;
  },

  // ----------------------------------------------------------
  // Generar recursos (nodos recolectables)
  // ----------------------------------------------------------
  spawnResources(grid) {
    const resources = [];
    const W = this.width, H = this.height;

    for (let y = 2; y < H - 2; y++) {
      for (let x = 2; x < W - 2; x++) {
        const tile = grid[y * W + x];
        const r = this.hash(x, y, 9999);

        let def = null;
        if (tile === 3 && r < 0.35)       def = ContentDB.findById(ContentDB.resources, 'tree');
        else if (tile === 2 && r < 0.04)  def = ContentDB.findById(ContentDB.resources, 'berry');
        else if (tile === 4 && r < 0.25)  def = ContentDB.findById(ContentDB.resources, 'stone');
        else if (tile === 5 && r < 0.4)   def = ContentDB.findById(ContentDB.resources, 'ore');

        if (def) {
          resources.push({
            id: 'r_' + x + '_' + y,
            def: def,
            x: x * this.tileSize + this.tileSize / 2,
            y: y * this.tileSize + this.tileSize / 2,
            amount: def.max
          });
        }
      }
    }

    return resources;
  }
};