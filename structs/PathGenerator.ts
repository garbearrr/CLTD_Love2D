export namespace PathGen {
  /**
 * Generate a perfect maze plus its unique solution path.
 *
 * @param width   number of grid cells horizontally   (≥ 2)
 * @param height  number of grid cells vertically     (≥ 2)
 * @param river   0 … 1  Up-bias strength: 0 = classic DFS, 1 = strong bias
 */
export function generateMaze(
  width: number,
  height: number,
  river: number = 0.4
): MazeResult {
  // ──────────────── helpers ────────────────
  function inside(p: Point): boolean {
    return p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
  }

  function neighbours(p: Point): Point[] {
    return [
      { x: p.x, y: p.y - 1 }, // N
      { x: p.x + 1, y: p.y }, // E
      { x: p.x, y: p.y + 1 }, // S
      { x: p.x - 1, y: p.y }, // W
    ];
  }

  function dirIndex(from: Point, to: Point): 0 | 1 | 2 | 3 {
    if (to.y < from.y) return 0; // N
    if (to.x > from.x) return 1; // E
    if (to.y > from.y) return 2; // S
    return 3; // W
  }

  // ──────────────── allocate grid & helpers without Array.from/fill ─────────────
  const grid: boolean[][] = [];
  const visited: boolean[][] = [];
  const parent: (Point | null)[][] = [];

  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    const vrow: boolean[] = [];
    const prow: (Point | null)[] = [];
    for (let x = 0; x < width; x++) {
      row.push(false);
      vrow.push(false);
      prow.push(null);
    }
    grid.push(row);
    visited.push(vrow);
    parent.push(prow);
  }

  // ──────────────── choose random entrance/exit ────────────────
  const entry: Point = { x: Math.floor(Math.random() * width), y: height - 1 };
  const exit: Point = { x: Math.floor(Math.random() * width), y: 0 };

  // ──────────────── depth-first carving (iterative stack) ────────────────
  const stack: Point[] = [entry];
  visited[entry.y][entry.x] = true;
  grid[entry.y][entry.x] = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    // gather unvisited neighbours + weights
    const candPoints: Point[] = [];
    const candWeights: number[] = [];
    let totalWeight = 0;

    const neigh = neighbours(current);
    for (let i = 0; i < neigh.length; i++) {
      const n = neigh[i];
      if (!inside(n) || visited[n.y][n.x]) continue;

      const d = dirIndex(current, n);
      // weight calculation (same idea as earlier answer)
      let w = 1;
      if (d === 0) w += 2 * river; // N
      else if (d === 2) w -= river; // S
      else w += river; // E/W

      candPoints.push(n);
      candWeights.push(w);
      totalWeight += w;
    }

    if (candPoints.length === 0) {
      stack.pop(); // back-track
      continue;
    }

    // roulette-wheel choose next
    const rTarget = Math.random() * totalWeight;
    let acc = 0;
    let chosen: Point = candPoints[0]; // fallback
    for (let i = 0; i < candPoints.length; i++) {
      acc += candWeights[i];
      if (acc >= rTarget) {
        chosen = candPoints[i];
        break;
      }
    }

    // knock down wall (open passage) and advance
    grid[chosen.y][chosen.x] = true;
    visited[chosen.y][chosen.x] = true;
    parent[chosen.y][chosen.x] = current;
    stack.push(chosen);
  }

  // ──────────────── reconstruct solution path (exit → entry) ────────────────
  const solution: Point[] = [];
  let cur: Point | null = exit;
  while (cur) {
    solution.push(cur);
    cur = parent[cur.y][cur.x];
  }
  solution.reverse(); // entry → exit

  return { grid, solution };
}
}
