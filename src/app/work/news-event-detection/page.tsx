/**
 * Finding the Story: case study page (graphical NER and news event detection).
 *
 * Role in the system: the fourth built portfolio entry, covering the IBM
 * engagement that read a live news feed and found the events forming around a
 * client's supply chain. It is the most research-shaped entry on the site, and
 * it is the only one whose outcome is a proof of concept rather than a shipped
 * system, so the page has to earn its place on the strength of the method.
 *
 * Key design decisions:
 *   - **Dated on purpose.** The work predates practical LLM agents, and the
 *     obvious modern reader question is "why not just ask a model?". The page
 *     answers that directly rather than hoping nobody asks, and closes by saying
 *     what it would now be built on.
 *   - **The algorithm runs on the page.** The client is confidential and the
 *     outputs stayed at IBM, so `lib/newsGraph.ts` implements the real procedure
 *     over a synthetic feed and the figure steps through it live. Betweenness,
 *     the local clustering, and the persona construction are the actual ones.
 *   - **An honest outcome.** It did not ship. Saying so plainly and then being
 *     specific about what was learned is worth more than dressing a proof of
 *     concept up as a product.
 */

import Link from "next/link";
import EntrySummary from "@/components/EntrySummary";
import StorySplit from "@/components/StorySplit";
import StoryEvolution from "@/components/StoryEvolution";
import StreamPipeline from "@/components/StreamPipeline";
import {
  TARGET,
  STEPS,
  NODES_BEFORE,
  NODES_AFTER,
  EDGES_BEFORE,
  COMPONENTS_AFTER,
  STORY_NAMES,
  BRIDGE_ENTITIES,
} from "@/lib/newsGraph";
import {
  BASELINE,
  PEAK_ONE,
  PEAK_TWO,
  TROUGH,
  RENEWAL,
} from "@/lib/storyTimeline";

export const metadata = {
  title: "Finding the Story",
  description:
    "At IBM I built a streaming system that read a live news feed and found the events forming around a client's supply chain, by splitting an entity graph into overlapping stories.",
  openGraph: {
    title: "Finding the Story | Charlie Tolleson",
    description:
      "Graphical NER and news event detection at IBM. Splitting an entity co-occurrence graph into overlapping stories that can be tracked as they grow, fade, and return.",
    type: "article",
    url: "https://charlietolleson.com/work/news-event-detection",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finding the Story | Charlie Tolleson",
    description:
      "A supply chain can break in a thousand ways. Finding the news about it, before anyone knew what to search for.",
  },
};

/** Fact rows shown under the title, so the scope is legible at a glance. */
const META: [string, string][] = [
  ["Role", "Data science lead: method, algorithm, and the research write-up"],
  ["Team", "Two developers, one designer, two product managers"],
  [
    "Context",
    "IBM engagement for a client whose supply chain moves global prices",
  ],
  [
    "Approach",
    "Streaming NER into an entity graph, split into stories by persona duplication",
  ],
  ["Outcome", "Proof of concept, published internally at IBM for patent cover"],
];

export default function NewsEventDetectionPage() {
  const splits = STEPS.length - 1;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-32 sm:px-10 lg:px-20">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="w-fit font-mono text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Work
          </Link>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            Finding the Story @IBM
          </h1>

          <p className="max-w-3xl text-2xl leading-snug text-zinc-500">
            A supply chain can break in a thousand ways. Almost none of them have
            an alert.
          </p>

          <EntrySummary
            intro="A truck breaks down, a plant catches fire, a port shuts, a strike starts, a storm reroutes a shipping lane. Each of those reaches the world as news, written in words nobody set up a rule for in advance. As the data science lead on a team of six at IBM, I built a system that read a live global news feed and, rather than matching terms, found the stories forming around a client's suppliers and tracked each one as it grew, faded, and came back."
            pairs={[
              [
                "The events worth alerting on run from a factory fire to civil unrest to a currency move, so there is no list of terms to watch and no labelled set to train on.",
                "Treated it as structure discovery instead of classification: surface whatever stories are forming around the client, then rank them, rather than asking only about the events I already knew to ask about.",
              ],
              [
                "The state of the art in topic modelling had to re-read the entire corpus on every run, which is the wrong cost shape for an alert system that has to be current.",
                "Moved the representation to a graph that could be rebuilt over a time window and compared against yesterday's, so the recurring cost was one window rather than the whole archive.",
              ],
              [
                "A real entity belongs to several stories at once, and every clustering method available would force it into exactly one.",
                "Adapted the persona idea behind Google's Splitter: duplicate the entities holding the graph together, so one entity can sit inside many stories without fusing them into one.",
              ],
              [
                "A single wire story republished across dozens of outlets would have dominated the graph on volume alone.",
                "MinHash with banded LSH in the ingestion path, tuned to collapse syndicated reprints while keeping two outlets genuinely covering the same event as two articles.",
              ],
            ]}
          />

          <dl className="mt-2 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-3 border-t border-zinc-200 pt-6 sm:grid-cols-2">
            {META.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                  {k}
                </dt>
                <dd className="m-0 text-base text-zinc-700">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="max-w-3xl border-l-2 border-amber-500 pl-5 text-base leading-relaxed text-zinc-600">
            <span className="font-medium text-zinc-800">
              A note on the figures.
            </span>{" "}
            The client is confidential and the original outputs stayed at IBM, so
            no real feed, entity, or result appears here. The algorithm does: the
            graph figure below runs the actual betweenness scoring and persona
            splitting in your browser, over a feed written for this page.
          </p>
        </div>

        {/* ---- Problem ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            An alert for something you cannot list
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            The client ran a supply chain large enough that its prices move
            global commerce. What they wanted was simple to say: tell us when
            something has gone wrong out there, early enough to do something
            about it.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The difficulty is in the word something. A supply chain takes damage
            from a truck breaking down, a factory fire, a dockworkers&apos;
            strike, a typhoon, a bankruptcy, a border closing, civil unrest.
            These have nothing in common except their effect. Any list of things
            to watch for is a list of the disruptions that have already happened
            to someone, and the expensive ones are usually the ones not on it.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            So the requirement was not a classifier. It was closer to the
            opposite: a system that could notice that something was forming
            without having been told what to look for, and put it in front of a
            person while it was still early.
          </p>
        </section>

        {/* ---- The feed ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              One source wide enough to cover all of it
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              The best answer would have been the Twitter firehose, the live
              stream of every tweet being posted. It sees a factory fire before
              any newsroom does. It was also far outside what the engagement
              could pay for, so the practical answer was a commercial news feed:
              several hundred news and blog sources worldwide, arriving live.
              Slower than the firehose by some hours, and enormously cleaner.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              I worked with the two developers on the team to build the path that
              turns that feed into something a graph can be built from. Kafka to
              move articles between stages, MinHash and LSH to collapse
              near-duplicate wire copy, named entity recognition to tag entities
              and key phrases, and Elasticsearch to hold the result so any time
              window could be rebuilt on demand.
            </p>
          </div>

          <StreamPipeline />
        </section>

        {/* ---- Why not LDA ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            The state of the art was the wrong shape
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            Event detection at the time mostly meant topic modelling, and topic
            modelling mostly meant LDA: a statistical method that finds sets of
            words which tend to occur together across a body of documents. It
            works, and for a fixed archive it works well.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The problem is what it costs and what it assumes. LDA fits over the
            whole corpus at once, so keeping it current means re-fitting
            repeatedly against an archive that only grows. It also wants to be
            told how many topics there are, which is a strange thing to have to
            declare about the world&apos;s events, and its topics have no
            identity across runs, so today&apos;s topic four has no particular
            relationship to yesterday&apos;s topic four.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            That last point is the one that actually rules it out. An alert
            system is not asking what topics exist. It is asking what changed
            since yesterday, which requires the things being compared to be the
            same kind of object across time. What I needed was a structure that
            could grow, shrink, and be compared against its own previous state,
            the way the events themselves do.
          </p>
        </section>

        {/* ---- The idea ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            One entity, many stories
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            So I moved the representation to a graph. Nodes are entities and key
            phrases pulled by the tagger; an edge between two of them means they
            appeared in the same article, weighted by how often. Building it over
            a time window is cheap, and two windows can be compared directly.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            Which surfaces the real obstacle immediately. Take the entity you
            care about and pull in everything mentioned alongside it, and you get
            one dense tangle, because the events overlap. The phrase{" "}
            <span className="font-mono text-zinc-800">shipping delays</span>{" "}
            belongs to the port strike and the typhoon and the factory fire all
            at once. Ordinary clustering has to award it to one of them, and in
            doing so either fuses three events into one or breaks a real
            connection.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The idea that unlocked it came from{" "}
            <a
              href="https://research.google/blog/innovations-in-graph-representation-learning/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              Splitter
            </a>
            , from Google&apos;s graph mining group. Their observation is that a
            node deserves more than one representation, because a person sits in
            a family and a workplace and those are different contexts. Their fix
            is a persona graph: duplicate a node once per community it belongs
            to, and let the copies live separate lives.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            I did not use Splitter itself. It learns embeddings, and training
            embeddings on every window is exactly the recurring cost I had just
            moved the whole design to avoid. What I took was the underlying move,
            duplication rather than assignment, and rebuilt it as something that
            runs directly on the graph: repeatedly find the entity holding the
            most unrelated things together, split it into one copy per context,
            and let the graph fall apart along its natural seams.
          </p>
        </section>

        {/* ---- The algorithm ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Splitting the tangle
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              The measure of holding things together is betweenness centrality:
              the share of all shortest paths that run through a node. An entity
              with high betweenness is doing duty in more than one place at once,
              which makes it both the reason the graph is unreadable and the
              thing to duplicate first.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              Below is the ego-network of a fictional client,{" "}
              <span className="font-medium text-zinc-900">{TARGET}</span>:{" "}
              {NODES_BEFORE} entities and {EDGES_BEFORE} co-occurrence edges,
              containing {STORY_NAMES.length} unrelated events. Step through the{" "}
              {splits} splits and watch it come apart.
            </p>
          </div>

          <StorySplit variant="full" />

          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-xl leading-relaxed text-zinc-700">
              The first split is the instructive one. Duplicating the client
              itself, by far the highest-betweenness entity, changes nothing:
              the graph is still a single piece. What was actually holding it
              together was the shared vocabulary underneath, phrases like{" "}
              <span className="font-mono text-zinc-800">
                {BRIDGE_ENTITIES[1]}
              </span>{" "}
              and{" "}
              <span className="font-mono text-zinc-800">
                {BRIDGE_ENTITIES[2]}
              </span>
              , each of which belongs to several events at once. Splitting those
              is what makes it fall open.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              After {splits} splits, {NODES_BEFORE} entities have become{" "}
              {NODES_AFTER} nodes across {COMPONENTS_AFTER} components, and each
              component is one of the events that generated the data:{" "}
              {STORY_NAMES.map((n) => n.toLowerCase()).join(", ")}. The client
              appears in all {COMPONENTS_AFTER} of them, which is correct, and is
              precisely what a method that had to assign each entity to a single
              cluster could not have told you.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              Nothing is deleted along the way. No edge is cut and no
              co-occurrence is discarded; entities are only ever copied. That
              matters because the components are then readable as evidence: each
              one is a set of phrases that genuinely arrived together, from
              multiple independent sources, which is a much better description of
              a news story than a ranked list of words.
            </p>
          </div>
        </section>

        {/* ---- Evolution ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              A story is a thing with a life
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              Running the split on one window finds stories. Running it on
              consecutive windows is what turns a story into an object you can
              watch, because the components can be matched across days by the
              entities they share. A story then has a size, a direction, and a
              vocabulary that shifts as new information arrives.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              The first real one I found was IBM&apos;s acquisition of Red Hat.
              I was at IBM, so it was the obvious thing to point the system at,
              and the timeline turned out to be a near-perfect demonstration of
              why the shape of the method matters.
            </p>
          </div>

          <StoryEvolution />

          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-xl leading-relaxed text-zinc-700">
              The story sits at {BASELINE.size} phrases of background chatter,
              spikes to {PEAK_ONE.size} when the European Commission clears the
              deal, then decays over the following week and a half to{" "}
              {TROUGH.size}. On any reasonable reading it is over. Then the
              acquisition actually closes, the two CEOs brief the press, and it
              comes back larger than it ever was, at {PEAK_TWO.size}.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              The second peak is the part worth pausing on.{" "}
              {Math.round(RENEWAL.share * 100)}% of its vocabulary never appeared
              during the first: the regulatory language of the approval is gone
              and a product and market language has replaced it. A keyword rule
              written on the day the story broke would have been watching for the
              wrong words by the time the story mattered most, and it would have
              been the analyst&apos;s job to notice and rewrite it. Here the
              component simply grew new nodes.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              That is the behaviour the client actually needed. A disruption does
              not arrive fully formed with its final vocabulary attached. It
              starts as a few local reports, changes words as it develops, and
              the useful alert is the one that fires on a component growing fast,
              whatever words happen to be in it that week.
            </p>
          </div>
        </section>

        {/* ---- Outcome ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Where it ended up
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            It did not ship. The project ended at proof of concept, and I wrote
            up the method and the findings as an internal IBM paper, which is how
            research gets published there when the patent position matters more
            than the citation. So the honest summary is that I have the method
            and the evidence it works, and no production system to point at.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            What I would defend is the shape of the answer. The requirement was
            an alert for a category of event nobody can enumerate, and the
            instinct in the room, then and now, is to enumerate harder: more
            keywords, more categories, more labelled data. Structure discovery
            was the right call, and the reason I still believe it is that the
            IBM and Red Hat timeline was found without anybody telling the system
            that a company acquisition was a thing that happens.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            It is also the most enjoyable technical problem I have worked on,
            which is not a business argument, but it is why I have kept thinking
            about it since.
          </p>
        </section>

        {/* ---- Today ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            What I would build now
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            The obvious modern question is why not just give the feed to a
            language model. For reading any single article, that is now clearly
            the better tool: it understands context, resolves entities properly,
            and needs no tagger. The context-free semantic similarity I had to
            work with was the weakest part of the pipeline by a distance.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            What a model does not do on its own is the part this project was
            actually about. Deciding that fourteen articles from nine outlets over
            three days are one event, that the event is growing, and that its
            vocabulary has turned over since last week is a question about
            structure across a corpus and across time, not about the meaning of
            any one document. Reading every article with a model to answer it
            would put me back at a cost that scales with the archive, which is
            where LDA already was.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            So the version I would build today keeps the graph and changes what
            fills it. A model does the extraction and the entity resolution,
            which is where it is strongest and where my pipeline was weakest. The
            splitting stays, because it is cheap and it is the part that produces
            an object with an identity over time. And the model comes back at the
            end, where it is strong again: reading a component and writing the
            two sentences that tell an operations team whether this one is worth
            their morning.
          </p>
        </section>

        {/* ---- Bridge ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            The thread back to everything else
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            This is the earliest work on this site and the one that reads least
            like the others, but it is the same instinct. Give a decision-maker a
            structure that accounts for what it is showing them, rather than a
            model output they have to take on faith. Here it is components that
            keep every co-occurrence that produced them;{" "}
            <Link
              href="/work/metric-decomposition"
              className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              in the decomposition work
            </Link>{" "}
            it is contributions that sum exactly to the number being explained.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The other thing it taught me, which I have used constantly since, is
            that the cost shape of a method is a product decision. LDA was not
            rejected because it was inaccurate. It was rejected because
            re-reading the corpus is the wrong thing to be doing every hour, and
            no amount of accuracy fixes that. That is the same reasoning I now
            apply to model choice inside{" "}
            <Link
              href="/work/ai-orchestration"
              className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              agent workflows
            </Link>
            .
          </p>
        </section>

        {/* ---- Footer ---- */}
        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-medium text-zinc-900">
            About the figures
          </h2>
          <p className="text-base leading-relaxed text-zinc-600">
            The graph figure is the algorithm, not a picture of it. Betweenness
            centrality is computed with Brandes&apos; algorithm, the
            neighbourhood clustering and the persona construction run on every
            step, and the layout is a force simulation over the result, all in the
            browser over a synthetic feed. The dedup curves are the LSH banding
            formula evaluated directly. The story timeline is a reconstruction:
            the dates and events are the public record of the acquisition, and the
            phrase sets are rebuilt from the poster I presented at IBM.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-200 pt-6 text-base">
            <span className="text-zinc-600">
              Happy to talk about any of this.
            </span>
            <a
              href="mailto:charlietolleson@gmail.com"
              className="font-mono text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              charlietolleson@gmail.com
            </a>
            <Link
              href="/"
              className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              More work
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
