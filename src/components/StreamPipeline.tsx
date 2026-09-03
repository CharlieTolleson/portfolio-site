/**
 * StreamPipeline.tsx: the ingestion path, from news feed to entity graph.
 *
 * Role in the system: the interesting part of this project is the event
 * detection, but none of it runs without a feed that has been deduplicated and
 * tagged first, and without somewhere durable for the graph to live. This figure
 * exists so that the systems work is visible rather than implied, and so the
 * distinction the page depends on is legible at a glance: articles are stored,
 * and the graph is stored, and only the story extraction is recomputed.
 *
 * Key design decisions:
 *   - **Stages, not a flowchart.** The path is linear, so arrows and boxes would
 *     add drawing without adding information. Numbered cards carry the order and
 *     leave room for a sentence saying why each stage is there.
 *   - **The graph store is a stage of its own.** Putting Neo4j in the list is the
 *     point of the figure rather than a detail of it: it is what separates this
 *     from an approach that refits a model over the corpus.
 *   - **A server component.** No state and no animation, so it stays out of the
 *     client bundle.
 */

/** Pipeline stages, in the order an article passes through them. */
const STAGES: { name: string; detail: string }[] = [
  {
    name: "Feed",
    detail:
      "Several hundred news and blog sources worldwide, arriving continuously.",
  },
  {
    name: "Kafka",
    detail:
      "One topic per stage, so a slow consumer applies backpressure instead of dropping articles.",
  },
  {
    name: "MinHash",
    detail:
      "Syndicated reprints collapsed to one article, before near-identical copies can inflate a co-occurrence count.",
  },
  {
    name: "NER",
    detail:
      "Entities and key phrases tagged per article. These become the nodes.",
  },
  {
    name: "Elasticsearch",
    detail:
      "The articles themselves, so any story component can be traced back to the coverage that produced it.",
  },
  {
    name: "Neo4j",
    detail:
      "The entity graph, kept and added to rather than rebuilt. This is what makes a story an object with a history.",
  },
];

/**
 * The ingestion pipeline figure.
 */
export default function StreamPipeline() {
  return (
    <figure className="m-0 flex flex-col gap-5">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((s, i) => (
          <li
            key={s.name}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <span className="font-mono text-[11px] uppercase tracking-wide text-zinc-400">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-base font-medium text-zinc-900">
              {s.name}
            </span>
            <span className="text-sm leading-relaxed text-zinc-600">
              {s.detail}
            </span>
          </li>
        ))}
      </ol>

      <figcaption className="max-w-3xl text-sm leading-relaxed text-zinc-500">
        Only the last two stages hold state. Everything before them is a
        transformation an article passes through once.
      </figcaption>
    </figure>
  );
}
