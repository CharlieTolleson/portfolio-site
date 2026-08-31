import DemoChart from "@/components/DemoChart";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-8 bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 py-32 px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Charlie Tolleson
        </h1>
        <p className="max-w-md text-center text-lg text-zinc-600 dark:text-zinc-400">
          Portfolio scaffold — visx + Motion stack check below.
        </p>
        <DemoChart />
      </main>
    </div>
  );
}
