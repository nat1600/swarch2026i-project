export default function HomeLoading() {
  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden">
      {/* NavBar skeleton */}
      <div className="h-16 border-b-4 border-parla-dark/10 bg-white flex items-center px-6 gap-4">
        <div className="w-8 h-8 bg-parla-mist rounded-full animate-pulse" />
        <div className="flex-1" />
        <div className="w-10 h-10 bg-parla-mist rounded-full animate-pulse" />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Welcome card */}
        <div className="bg-white border-4 border-parla-dark/20 rounded-4xl p-8 md:p-10 shadow-[0_12px_0_0_#e2e8f0]">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-28 md:w-36 md:h-36 bg-parla-mist rounded-full animate-pulse shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-10 w-64 bg-parla-mist rounded-2xl animate-pulse" />
              <div className="h-5 w-48 bg-parla-mist rounded-xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <section className="space-y-5">
          <div className="h-8 w-56 bg-parla-mist rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white border-4 border-parla-dark/10 rounded-3xl p-6 h-36 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="space-y-5">
          <div className="h-8 w-40 bg-parla-mist rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white border-4 border-parla-dark/10 rounded-3xl p-6 h-24 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
