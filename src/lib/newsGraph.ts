/**
 * newsGraph.ts: the entity graph, the persona-splitting algorithm, and the
 * layout that draws them.
 *
 * Role in the system: the News Event Detection case study claims that a tangled
 * entity co-occurrence graph can be turned into a clean set of overlapping
 * "stories" by repeatedly duplicating its highest-betweenness nodes. This module
 * is that claim, implemented. The figures on the page do not draw a picture of
 * the algorithm's output; they draw the output.
 *
 * Key design decisions:
 *   - **The algorithm is real; only the corpus is synthetic.** The IBM work is
 *     proprietary and the client is confidential, so there is no news feed here.
 *     Brandes betweenness centrality, the neighbourhood-component test, the
 *     persona construction, and the Fruchterman-Reingold layout are the actual
 *     procedures, run in the browser over a hand-specified graph.
 *   - **Everything is seeded and computed at module load.** The page is
 *     prerendered and then hydrated, so a single `Math.random()` anywhere in this
 *     file would produce a server/client mismatch. All randomness comes from
 *     `mulberry32`, which makes every figure byte-identical in both passes.
 *   - **Layout carries identity, not colour.** Discovered components are
 *     separated in space and directly labelled, so the figures stay inside the
 *     site's two-accent palette instead of introducing a categorical ramp. Amber
 *     is reserved for the node being split at the current step.
 *   - **Positions are carried forward between steps.** Each split re-runs the
 *     layout starting from the previous step's coordinates rather than from
 *     scratch, so stepping through the algorithm reads as one graph relaxing
 *     rather than as a series of unrelated pictures.
 */

/* ------------------------------------------------------------------ *
 * Seeded randomness
 * ------------------------------------------------------------------ */

/**
 * Mulberry32: a small, fast, deterministic PRNG.
 *
 * @param seed Any 32-bit integer. The same seed always yields the same stream.
 * @returns A function producing successive floats in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Graph types
 * ------------------------------------------------------------------ */

/** A node in the entity graph. Personas share a `base` with their original. */
export type GNode = {
  /** Unique within a graph. Personas are suffixed, e.g. `shipping delays#2`. */
  id: string;
  /** Display text. Identical across every persona of the same entity. */
  label: string;
  /** True for the entity the ego-network was built around. */
  isTarget: boolean;
  /** True once this node is a duplicate produced by a split. */
  isPersona: boolean;
};

/** An undirected edge. `w` is the number of articles mentioning both entities. */
export type GEdge = { a: string; b: string; w: number };

export type Graph = { nodes: GNode[]; edges: GEdge[] };

/* ------------------------------------------------------------------ *
 * The synthetic corpus
 * ------------------------------------------------------------------ */

/**
 * The target entity the ego-network is built around.
 *
 * Fictional. The real engagement was with a client whose pricing moves global
 * commerce, and naming them is not mine to do.
 */
export const TARGET = "Meridian Retail";

/**
 * The latent stories in the synthetic feed, in the order a reader meets them.
 *
 * Each entry is the set of entities and key phrases that a real news feed would
 * surface together while that event is live. Entities appearing in more than one
 * story are the whole point of the exercise: they are what fuses five separate
 * events into one unreadable tangle, and they are what the algorithm has to
 * duplicate to pull them apart again.
 */
const STORY_SPECS: { name: string; members: string[] }[] = [
  {
    name: "Port strike",
    members: [
      "Port of Long Beach",
      "dockworkers union",
      "contract negotiation",
      "West Coast ports",
      "container backlog",
      "shipping delays",
    ],
  },
  {
    name: "Supplier fire",
    members: [
      "Kaohsiung plant",
      "production halt",
      "assembly line",
      "fire damage",
      "component supplier",
      "shipping delays",
    ],
  },
  {
    name: "Typhoon",
    members: [
      "Typhoon Hagibis",
      "vessel rerouting",
      "port closure",
      "South China Sea",
      "shipping delays",
    ],
  },
  {
    name: "Chip shortage",
    members: [
      "semiconductor",
      "wafer capacity",
      "lead times",
      "allocation",
      "component supplier",
    ],
  },
  {
    name: "Carrier bankruptcy",
    members: [
      "regional carrier",
      "Chapter 11",
      "trucking capacity",
      "freight rates",
      "container backlog",
    ],
  },
];

/** Story names, exported so the page can talk about what the split recovers. */
export const STORY_NAMES = STORY_SPECS.map((s) => s.name);

/** Entities that appear in more than one story, computed rather than listed. */
export const BRIDGE_ENTITIES: string[] = (() => {
  const seen = new Map<string, number>();
  for (const s of STORY_SPECS) {
    for (const m of s.members) seen.set(m, (seen.get(m) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([m]) => m);
})();

/**
 * Build the ego-network: the target entity plus its first-degree neighbours,
 * with edges weighted by how often two entities were mentioned in the same
 * article.
 *
 * Within a story every pair is connected with probability `P_WITHIN`, on top of
 * a guaranteed ring so that a story is never accidentally disconnected before
 * the algorithm has had a chance to work on it. The target connects to
 * everything, which is what makes it the highest-betweenness node in the graph.
 *
 * @returns The starting graph, before any splitting.
 */
function buildGraph(): Graph {
  const rand = mulberry32(20260903);

  const labels = new Set<string>([TARGET]);
  for (const s of STORY_SPECS) for (const m of s.members) labels.add(m);

  const nodes: GNode[] = [...labels].map((label) => ({
    id: label,
    label,
    isTarget: label === TARGET,
    isPersona: false,
  }));

  /** Edge weights, keyed by the two endpoints sorted, so pairs never double up. */
  const weights = new Map<string, number>();
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const bump = (a: string, b: string, w: number) => {
    const k = key(a, b);
    weights.set(k, (weights.get(k) ?? 0) + w);
  };

  // A live news story is a tight bundle: within the few days it is running, its
  // handful of key entities turn up in the same articles again and again, so the
  // story is close to a complete subgraph rather than a sparse one. Modelling it
  // that way is not a convenience. It is the property that makes the tangle look
  // the way it does, and the property the clustering step relies on to tell one
  // story from another once a shared entity is holding them together.
  for (const s of STORY_SPECS) {
    for (let i = 0; i < s.members.length; i++) {
      for (let j = i + 1; j < s.members.length; j++) {
        bump(s.members[i], s.members[j], 3 + Math.floor(rand() * 10));
      }
    }
    // The target is mentioned alongside every entity in every story about it,
    // which is what makes it the highest-betweenness node in the graph and the
    // first thing the algorithm reaches for.
    for (const m of s.members) bump(TARGET, m, 4 + Math.floor(rand() * 10));
  }

  const edges: GEdge[] = [...weights.entries()].map(([k, w]) => {
    const [a, b] = k.split("|");
    return { a, b, w };
  });

  return { nodes, edges };
}

/* ------------------------------------------------------------------ *
 * Graph utilities
 * ------------------------------------------------------------------ */

/** Adjacency sets, rebuilt from the edge list. */
function adjacency(g: Graph): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const n of g.nodes) adj.set(n.id, new Set());
  for (const e of g.edges) {
    adj.get(e.a)?.add(e.b);
    adj.get(e.b)?.add(e.a);
  }
  return adj;
}

/**
 * Edge-weight lookup for a graph, as a function over unordered pairs.
 *
 * @param g The graph.
 * @returns A function returning the co-occurrence count for a pair, or 0.
 */
function weightLookup(g: Graph): (a: string, b: string) => number {
  const w = new Map<string, number>();
  for (const e of g.edges) {
    w.set(e.a < e.b ? `${e.a}|${e.b}` : `${e.b}|${e.a}`, e.w);
  }
  return (a, b) => w.get(a < b ? `${a}|${b}` : `${b}|${a}`) ?? 0;
}

/**
 * Connected components of a graph, as arrays of node ids.
 *
 * @param ids The nodes to consider.
 * @param adj Adjacency for the whole graph; neighbours outside `ids` are ignored.
 * @returns One array per component, in discovery order.
 */
function componentsOf(
  ids: string[],
  adj: Map<string, Set<string>>
): string[][] {
  const inScope = new Set(ids);
  const seen = new Set<string>();
  const out: string[][] = [];

  for (const start of ids) {
    if (seen.has(start)) continue;
    const comp: string[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const v = stack.pop() as string;
      comp.push(v);
      for (const w of adj.get(v) ?? []) {
        if (inScope.has(w) && !seen.has(w)) {
          seen.add(w);
          stack.push(w);
        }
      }
    }
    out.push(comp);
  }
  return out;
}

/**
 * Betweenness centrality by Brandes' algorithm, on the unweighted graph.
 *
 * Betweenness asks what fraction of all shortest paths run through a node. In an
 * entity graph that is exactly the question "which entity is holding together
 * things that would otherwise be unrelated?", which is why it is the right
 * ranking to split on: high betweenness marks an entity that is doing duty in
 * more than one story at once.
 *
 * Edge weights are deliberately ignored. Co-occurrence counts say how loudly two
 * entities were discussed together, not how far apart two stories are, and
 * treating a high count as a short path would make the busiest story swallow its
 * neighbours.
 *
 * @param g The graph to score.
 * @returns Normalised scores in [0, 1], keyed by node id.
 */
export function betweenness(g: Graph): Map<string, number> {
  const adj = adjacency(g);
  const ids = g.nodes.map((n) => n.id);
  const cb = new Map<string, number>(ids.map((i) => [i, 0]));

  for (const s of ids) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>(ids.map((i) => [i, []]));
    const sigma = new Map<string, number>(ids.map((i) => [i, 0]));
    const dist = new Map<string, number>(ids.map((i) => [i, -1]));
    sigma.set(s, 1);
    dist.set(s, 0);

    const queue: string[] = [s];
    for (let head = 0; head < queue.length; head++) {
      const v = queue[head];
      stack.push(v);
      const dv = dist.get(v) as number;
      for (const w of adj.get(v) ?? []) {
        if ((dist.get(w) as number) < 0) {
          dist.set(w, dv + 1);
          queue.push(w);
        }
        if (dist.get(w) === dv + 1) {
          sigma.set(w, (sigma.get(w) as number) + (sigma.get(v) as number));
          pred.get(w)?.push(v);
        }
      }
    }

    const delta = new Map<string, number>(ids.map((i) => [i, 0]));
    for (let i = stack.length - 1; i >= 0; i--) {
      const w = stack[i];
      for (const v of pred.get(w) ?? []) {
        const contrib =
          ((sigma.get(v) as number) / (sigma.get(w) as number)) *
          (1 + (delta.get(w) as number));
        delta.set(v, (delta.get(v) as number) + contrib);
      }
      if (w !== s) cb.set(w, (cb.get(w) as number) + (delta.get(w) as number));
    }
  }

  // Undirected graphs count every pair twice, and the normaliser puts the score
  // on [0, 1] so a threshold means the same thing at any graph size.
  const n = ids.length;
  const denom = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;
  for (const id of ids) {
    cb.set(id, (cb.get(id) as number) / 2 / denom);
  }
  return cb;
}

/* ------------------------------------------------------------------ *
 * Local clustering
 * ------------------------------------------------------------------ */

/**
 * Partition a node's neighbourhood into communities by weighted label
 * propagation.
 *
 * This is the step the persona-graph framework leaves open. Partitioning the
 * neighbourhood by connected components is the textbook illustration of it, and
 * on a real co-occurrence graph it does nothing at all: every entity in an
 * ego-network is reachable from every other through some third entity, so the
 * neighbourhood is always a single component and no node is ever splittable.
 * A local clustering is what actually separates the contexts.
 *
 * Label propagation is used because it is linear in the number of edges, needs
 * no target number of clusters, and requires no training. All three mattered:
 * the point of the whole approach was to react to a live feed rather than
 * re-fit a model over the corpus.
 *
 * Determinism is deliberate. Label propagation is normally randomised and
 * therefore unstable between runs, which would be a poor property for an alert
 * system and a fatal one for a prerendered page. Nodes are visited in a fixed
 * order and ties are broken by label, so the same graph always yields the same
 * communities.
 *
 * @param members The neighbourhood to partition, with the centre node excluded.
 * @param adj Adjacency for the whole graph; edges leaving `members` are ignored.
 * @param weight Edge weight lookup, so a strong co-occurrence pulls harder.
 * @returns One array of node ids per community, largest first.
 */
function localCommunities(
  members: string[],
  adj: Map<string, Set<string>>,
  weight: (a: string, b: string) => number
): string[][] {
  const inScope = new Set(members);
  // Sorting fixes the visit order, which is what makes the result reproducible.
  const order = [...members].sort();
  const label = new Map<string, string>(order.map((m) => [m, m]));

  const MAX_ROUNDS = 30;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    let changed = false;
    for (const v of order) {
      const tally = new Map<string, number>();
      for (const w of adj.get(v) ?? []) {
        if (!inScope.has(w)) continue;
        const l = label.get(w) as string;
        tally.set(l, (tally.get(l) ?? 0) + weight(v, w));
      }
      if (tally.size === 0) continue;

      let best = label.get(v) as string;
      let bestScore = -1;
      // Ties resolve to the lexicographically smaller label rather than to
      // whichever happened to be visited first.
      for (const [l, score] of [...tally.entries()].sort((a, b) =>
        a[0] < b[0] ? -1 : 1
      )) {
        if (score > bestScore) {
          bestScore = score;
          best = l;
        }
      }
      if (best !== label.get(v)) {
        label.set(v, best);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const groups = new Map<string, string[]>();
  for (const m of order) {
    const l = label.get(m) as string;
    if (!groups.has(l)) groups.set(l, []);
    groups.get(l)?.push(m);
  }

  return absorbFragments(
    [...groups.values()].sort((a, b) => b.length - a.length),
    weight
  );
}

/**
 * Smallest community that is allowed to become its own persona.
 *
 * Label propagation strands the occasional single node in a community of its
 * own. Left alone, each of those becomes a persona attached to one neighbour,
 * and the finished graph carries two-node fragments that are not stories and
 * that a reader would reasonably read as a bug. The live system had the same
 * problem and the same answer: a story has to have a floor on its size.
 */
const MIN_COMMUNITY = 2;

/**
 * Fold undersized communities into whichever surviving community they are most
 * strongly attached to.
 *
 * @param groups Communities, largest first.
 * @param weight Edge weight lookup.
 * @returns Communities of at least `MIN_COMMUNITY` members, largest first.
 */
function absorbFragments(
  groups: string[][],
  weight: (a: string, b: string) => number
): string[][] {
  const keep = groups.filter((g) => g.length >= MIN_COMMUNITY);
  const fragments = groups.filter((g) => g.length < MIN_COMMUNITY);
  // Nothing to absorb into: the neighbourhood is all fragments, so leave it be
  // and let the caller's `groups.length > 1` test decide.
  if (keep.length === 0) return groups;

  for (const frag of fragments) {
    let bestIdx = -1;
    let bestScore = 0;
    keep.forEach((g, i) => {
      let score = 0;
      for (const f of frag) for (const m of g) score += weight(f, m);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    });
    // A fragment with no edge into any surviving community has no community it
    // belongs in, and picking one anyway would invent structure that is not in
    // the data. It keeps its own persona and the size floor is not enforced.
    if (bestIdx < 0) keep.push(frag);
    else keep[bestIdx].push(...frag);
  }

  return keep.sort((a, b) => b.length - a.length);
}

/* ------------------------------------------------------------------ *
 * The splitting algorithm
 * ------------------------------------------------------------------ */

/**
 * Betweenness below which a node is left alone.
 *
 * This is the one real knob on the method, and it is the trade-off between
 * splitting stories that should have stayed together and leaving two stories
 * fused. It is set here where the synthetic graph separates cleanly; on the live
 * feed it was tuned against a labelled sample.
 */
export const SPLIT_THRESHOLD = 0.04;

/** One iteration of the algorithm, as consumed by the stepper figure. */
export type SplitStep = {
  /** Graph state *after* this step's split. Step 0 is the untouched graph. */
  graph: Graph;
  /** Label of the entity duplicated at this step, or null for step 0. */
  splitLabel: string | null;
  /** That entity's betweenness before it was duplicated. */
  splitScore: number;
  /** How many personas it became. */
  personas: number;
  /** Connected components in `graph`, as arrays of node ids. */
  components: string[][];
};

/**
 * Duplicate one node into a persona per neighbourhood component.
 *
 * This is the operation borrowed from Google's persona-graph work: look at the
 * node's ego-network with the node itself removed, find the groups its
 * neighbours fall into, and give each group its own copy of the node. The copies
 * are never joined to each other, which is what lets a single entity sit inside
 * several stories at once without gluing them together.
 *
 * @param g The current graph.
 * @param id The node to duplicate.
 * @param groups Its neighbours, partitioned into components.
 * @returns A new graph; the original is not mutated.
 */
function duplicate(g: Graph, id: string, groups: string[][]): Graph {
  const original = g.nodes.find((n) => n.id === id) as GNode;
  const nodes = g.nodes.filter((n) => n.id !== id);
  const edges = g.edges.filter((e) => e.a !== id && e.b !== id);
  const removed = g.edges.filter((e) => e.a === id || e.b === id);

  groups.forEach((group, i) => {
    const personaId = `${id}#${i + 1}`;
    nodes.push({
      id: personaId,
      label: original.label,
      isTarget: original.isTarget,
      isPersona: true,
    });
    const inGroup = new Set(group);
    for (const e of removed) {
      const other = e.a === id ? e.b : e.a;
      if (inGroup.has(other)) edges.push({ a: personaId, b: other, w: e.w });
    }
  });

  return { nodes, edges };
}

/**
 * Run the algorithm to completion, recording every intermediate state.
 *
 * The loop is: score every node by betweenness, take the highest-scoring node
 * whose removal would break its own neighbourhood into more than one piece, and
 * duplicate it. Stop when no node clears the threshold. What is left is a set of
 * connected components in which a single entity may appear many times.
 *
 * @param start The graph to split.
 * @returns Step 0 (the untouched graph) followed by one entry per duplication.
 */
export function splitSteps(start: Graph): SplitStep[] {
  let g = start;
  const steps: SplitStep[] = [
    {
      graph: g,
      splitLabel: null,
      splitScore: 0,
      personas: 0,
      components: componentsOf(
        g.nodes.map((n) => n.id),
        adjacency(g)
      ),
    },
  ];

  // A generous ceiling. The loop's real exit is the threshold test below; this
  // only guarantees termination if the graph is ever changed to something
  // pathological.
  const MAX_STEPS = 40;

  for (let iter = 0; iter < MAX_STEPS; iter++) {
    const scores = betweenness(g);
    const adj = adjacency(g);
    const weightOf = weightLookup(g);

    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);

    let chosen: { id: string; score: number; groups: string[][] } | null = null;
    for (const [id, score] of ranked) {
      if (score < SPLIT_THRESHOLD) break;
      const neighbours = [...(adj.get(id) ?? [])];
      // The neighbourhood is clustered with `id` itself excluded, so the groups
      // are the genuinely separate contexts the node is bridging.
      const groups = localCommunities(neighbours, adj, weightOf).filter(
        (c) => c.length > 0
      );
      if (groups.length > 1) {
        chosen = { id, score, groups };
        break;
      }
    }

    if (!chosen) break;

    g = duplicate(g, chosen.id, chosen.groups);
    const label = (start.nodes.find((n) => n.id === chosen.id)?.label ??
      chosen.id.split("#")[0]) as string;

    steps.push({
      graph: g,
      splitLabel: label,
      splitScore: chosen.score,
      personas: chosen.groups.length,
      components: componentsOf(
        g.nodes.map((n) => n.id),
        adjacency(g)
      ),
    });
  }

  return steps;
}

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

export type Pos = { x: number; y: number };

/**
 * Fruchterman-Reingold force-directed layout inside a box.
 *
 * Repulsion between every pair spreads the nodes, springs along edges hold
 * connected ones together, and a weak pull to the centre keeps the drawing
 * compact. Only `Math.sqrt` is used from the maths library: IEEE-754 requires it
 * to be correctly rounded, so it gives the same answer everywhere, whereas
 * exponentials and trigonometry are implementation-defined and can differ
 * between Node and the browser. On a prerendered page that difference compounds
 * over hundreds of iterations and surfaces as a hydration mismatch.
 *
 * @param g The graph to lay out.
 * @param width Box width.
 * @param height Box height.
 * @param iterations How long to run. More is smoother and slower.
 * @param seed PRNG seed for the initial placement.
 * @returns Raw positions, not yet fitted to any frame.
 */
function simulate(
  g: Graph,
  width: number,
  height: number,
  iterations: number,
  seed: number
): Map<string, Pos> {
  const rand = mulberry32(seed);
  const ids = g.nodes.map((n) => n.id);
  const n = ids.length;
  const pos = new Map<string, Pos>();

  for (const id of ids) {
    // Seeded random placement. A ring start would need cos and sin, which are
    // exactly the calls this simulation has to avoid; a force layout converges
    // from a random start regardless.
    pos.set(id, {
      x: width / 2 + (rand() - 0.5) * width * 0.6,
      y: height / 2 + (rand() - 0.5) * height * 0.6,
    });
  }

  if (n < 2) return pos;

  const k = Math.sqrt((width * height) / n) * 0.62;
  const temp0 = Math.min(width, height) * 0.12;
  let temp = temp0;
  const disp = new Map<string, Pos>();

  for (let step = 0; step < iterations; step++) {
    for (const id of ids) disp.set(id, { x: 0, y: 0 });

    for (let i = 0; i < n; i++) {
      const a = pos.get(ids[i]) as Pos;
      for (let j = i + 1; j < n; j++) {
        const b = pos.get(ids[j]) as Pos;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.01) {
          // Coincident nodes have no direction to separate along, so nudge them
          // deterministically rather than dividing by zero.
          dx = (rand() - 0.5) * 0.1;
          dy = (rand() - 0.5) * 0.1;
          d2 = dx * dx + dy * dy + 0.01;
        }
        const d = Math.sqrt(d2);
        const f = (k * k) / d;
        const ux = (dx / d) * f;
        const uy = (dy / d) * f;
        const da = disp.get(ids[i]) as Pos;
        const db = disp.get(ids[j]) as Pos;
        da.x += ux;
        da.y += uy;
        db.x -= ux;
        db.y -= uy;
      }
    }

    for (const e of g.edges) {
      const a = pos.get(e.a);
      const b = pos.get(e.b);
      if (!a || !b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d * d) / k;
      const ux = (dx / d) * f;
      const uy = (dy / d) * f;
      const da = disp.get(e.a) as Pos;
      const db = disp.get(e.b) as Pos;
      da.x -= ux;
      da.y -= uy;
      db.x += ux;
      db.y += uy;
    }

    for (const id of ids) {
      const p = pos.get(id) as Pos;
      const d = disp.get(id) as Pos;
      d.x += (width / 2 - p.x) * 0.012;
      d.y += (height / 2 - p.y) * 0.012;
    }

    for (const id of ids) {
      const p = pos.get(id) as Pos;
      const d = disp.get(id) as Pos;
      const len = Math.sqrt(d.x * d.x + d.y * d.y) || 1;
      p.x += (d.x / len) * Math.min(len, temp);
      p.y += (d.y / len) * Math.min(len, temp);
    }

    temp = temp0 * (1 - (step + 1) / iterations) + 0.05;
  }

  return pos;
}

/**
 * Scale and translate positions to fill a rectangle.
 *
 * The two axes may scale by different amounts, up to `maxStretch`. A force
 * layout relaxes towards a roughly circular drawing whatever shape its frame is,
 * so a purely uniform fit leaves a landscape frame mostly margin. The cap is
 * what makes the stretch safe: unbounded, it would smear a near-degenerate
 * layout into a line.
 *
 * @param pos Positions to fit. Not mutated.
 * @param box Destination rectangle.
 * @param maxStretch Largest permitted ratio between the two axis scales.
 */
function fitInto(
  pos: Map<string, Pos>,
  box: { x: number; y: number; w: number; h: number },
  maxStretch = 1.45
): Map<string, Pos> {
  const out = new Map<string, Pos>();
  if (pos.size === 0) return out;

  const xs = [...pos.values()].map((p) => p.x);
  const ys = [...pos.values()].map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const rangeX = Math.max(Math.max(...xs) - minX, 1);
  const rangeY = Math.max(Math.max(...ys) - minY, 1);

  const sx = box.w / rangeX;
  const sy = box.h / rangeY;
  const uniform = Math.min(sx, sy);
  const fx = Math.min(sx, uniform * maxStretch);
  const fy = Math.min(sy, uniform * maxStretch);

  // Remaining slack is split evenly so the drawing sits centred in its box.
  const offX = box.x + (box.w - rangeX * fx) / 2;
  const offY = box.y + (box.h - rangeY * fy) / 2;

  for (const [id, p] of pos) {
    out.set(id, { x: (p.x - minX) * fx + offX, y: (p.y - minY) * fy + offY });
  }
  return out;
}

/** The subgraph induced on a set of node ids. */
function subgraph(g: Graph, ids: string[]): Graph {
  const keep = new Set(ids);
  return {
    nodes: g.nodes.filter((n) => keep.has(n.id)),
    edges: g.edges.filter((e) => keep.has(e.a) && keep.has(e.b)),
  };
}

/**
 * Columns to arrange `n` components in, for a frame of the given aspect.
 *
 * @param n Number of components.
 * @param aspect Frame width divided by height.
 */
function gridColumns(n: number, aspect: number): number {
  const c = Math.round(Math.sqrt(n * aspect));
  return Math.min(Math.max(c, 1), n);
}

/**
 * Lay a split graph out as a grid of separately-simulated components.
 *
 * This is the part that a single force simulation cannot do. Once the graph has
 * been split it is disconnected, and disconnected components in a force layout
 * have nothing pulling them together and everything pushing them apart: each one
 * contracts to a knot while the knots fly to the corners. Fitting that to a
 * frame produces five illegible dots. Simulating each component inside its own
 * cell instead gives every story the same amount of room regardless of how far
 * apart the simulation would have pushed them.
 *
 * @param g The graph.
 * @param components Its connected components, as arrays of node ids.
 * @param width Canvas width.
 * @param height Canvas height.
 * @param cols Column count. Defaults to whatever suits the canvas aspect.
 * @param fill Fraction of a cell's width the cluster itself occupies. The
 *   remainder is room for entity labels, which are drawn outside the nodes and
 *   are wider than the cluster. A figure that draws no labels can raise it.
 * @returns Positions for every node, keyed by id.
 */
export function layout(
  g: Graph,
  components: string[][],
  width: number,
  height: number,
  cols?: number,
  fill = 0.44
): Map<string, Pos> {
  const PAD = 26;

  if (components.length <= 1) {
    return fitInto(simulate(g, width, height, 420, 981721), {
      x: PAD * 2,
      y: PAD,
      w: width - PAD * 4,
      h: height - PAD * 2,
    });
  }

  // Largest first, so the busiest story takes the top-left cell where a reader
  // starts, and any short final row holds the smallest components.
  const ordered = [...components].sort((a, b) => b.length - a.length);
  const nCols = cols ?? gridColumns(ordered.length, width / height);
  const nRows = Math.ceil(ordered.length / nCols);

  const cellW = width / nCols;
  const cellH = height / nRows;

  const out = new Map<string, Pos>();

  ordered.forEach((comp, i) => {
    const row = Math.floor(i / nCols);
    const col = i % nCols;

    // A short final row is centred rather than left-aligned, so the arrangement
    // stays balanced when the component count is not a multiple of the columns.
    const inRow = Math.min(nCols, ordered.length - row * nCols);
    const rowOffset = ((nCols - inRow) * cellW) / 2;

    const sub = subgraph(g, comp);

    // The cluster box is kept close to square regardless of the cell's shape. A
    // cell on a 3:1 strip is tall and narrow, and letting the cluster inherit
    // that draws each story as a thin vertical oval, which reads as a property
    // of the story rather than of the frame it happens to be sitting in.
    const innerW = cellW * fill;
    const innerH = Math.min(cellH * 0.62, innerW * 1.3);
    const inner = {
      x: col * cellW + rowOffset + (cellW - innerW) / 2,
      y: row * cellH + (cellH - innerH) / 2,
      w: innerW,
      h: innerH,
    };
    const local = fitInto(
      simulate(sub, inner.w, inner.h, 300, 5150 + i * 977),
      inner,
      1.2
    );
    for (const [id, p] of local) out.set(id, p);
  });

  return out;
}
/* ------------------------------------------------------------------ *
 * Precomputed states
 * ------------------------------------------------------------------ */

/** The starting ego-network, before any splitting. */
export const BASE_GRAPH = buildGraph();

/** Every iteration of the algorithm on `BASE_GRAPH`. */
export const STEPS = splitSteps(BASE_GRAPH);

/** Canvas the interactive figure is drawn on. */
export const FIG_W = 900;
export const FIG_H = 600;

/**
 * Layouts for every step.
 *
 * Computed once at module load rather than inside a component: the same values
 * are needed during prerender and during hydration, and recomputing them on
 * every render would be both slower and a mismatch risk. Each step is laid out
 * independently and the figure tweens between them, because once the component
 * count changes the grid is repacked and carrying positions forward would be
 * carrying them into cells that no longer exist.
 */
export const STEP_LAYOUTS: Map<string, Pos>[] = STEPS.map((s) =>
  layout(s.graph, s.components, FIG_W, FIG_H)
);

/** Card canvas, matching the 3:1 thumbnails the other entries use. */
export const CARD_W = 1200;
export const CARD_H = 400;

/** The finished split, packed into a single row for the wide home-page card. */
export const CARD_LAYOUT = (() => {
  const last = STEPS[STEPS.length - 1];
  return layout(
    last.graph,
    last.components,
    CARD_W,
    CARD_H,
    // One row: on a 3:1 strip the stories read as a sequence, and the grid
    // heuristic would otherwise wrap them onto a second row and halve the space
    // each one gets.
    last.components.length,
    // The card draws no labels, so the clusters can have most of their cells.
    0.72
  );
})();

/** Node counts before and after, quoted in the page copy. */
export const NODES_BEFORE = BASE_GRAPH.nodes.length;
export const NODES_AFTER = STEPS[STEPS.length - 1].graph.nodes.length;
export const EDGES_BEFORE = BASE_GRAPH.edges.length;
export const COMPONENTS_AFTER = STEPS[STEPS.length - 1].components.length;
