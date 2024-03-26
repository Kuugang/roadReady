import Submission from "@/components/dashboard/submission";

export default function Home() {
  return (
    <main className="p-10 bg-green-900 h-full w-full">
      <div>
        <h2>Welcome Spery John</h2>
        {/* TODO: search here*/}
      </div>

      <h4>Top Dealership Submission</h4>
      <div className="flex flex-col gap-2 w-full">
        <Submission />
        <Submission />
        <Submission />
        <Submission />
        <Submission />
      </div>

      {/* TODO: absolute thing here */}
    </main>
  );
}
