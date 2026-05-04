export function MeSkeleton() {
  return (
    <div className="font-app min-h-screen w-full bg-polka selection:bg-parla-blue selection:text-white pb-20">
      {/* NavBar skeleton */}
      <div className="h-16 border-b-4 border-parla-dark/10 bg-white flex items-center px-6 gap-4">
        <div className="w-8 h-8 bg-parla-mist rounded-full animate-pulse" />
        <div className="flex-1" />
        <div className="w-10 h-10 bg-parla-mist rounded-full animate-pulse" />
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-12 space-y-6">
        {/* User header card */}
        <div className="bg-white rounded-4xl border-4 border-parla-dark/20 shadow-[0_12px_0_0_#e2e8f0] p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-parla-mist animate-pulse shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-10 w-48 bg-parla-mist rounded-2xl animate-pulse" />
              <div className="h-5 w-36 bg-parla-mist rounded-xl animate-pulse" />
              <div className="h-8 w-52 bg-parla-mist rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Language + streak cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-white rounded-4xl border-4 border-parla-dark/20 shadow-[0_8px_0_0_#e2e8f0] p-6 h-36 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
