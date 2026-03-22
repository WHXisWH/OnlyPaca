"use client";

// Full page loading spinner
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-dark-700 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-dark-400">Loading...</p>
      </div>
    </div>
  );
}

// Inline spinner
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div
      className={`${sizes[size]} border-current border-t-transparent rounded-full animate-spin`}
    />
  );
}

// Skeleton loader for cards
export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="h-24 bg-dark-700" />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-dark-700" />
          <div className="flex-1">
            <div className="h-4 bg-dark-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-dark-700 rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-dark-700 rounded w-full mb-2" />
        <div className="h-3 bg-dark-700 rounded w-2/3" />
      </div>
    </div>
  );
}

// Skeleton grid for explore page
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Skeleton for subscription card
export function SkeletonSubscription() {
  return (
    <div className="glass rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-dark-700" />
        <div className="flex-1">
          <div className="h-5 bg-dark-700 rounded w-1/3 mb-2" />
          <div className="h-3 bg-dark-700 rounded w-1/4" />
        </div>
        <div className="h-10 bg-dark-700 rounded w-24" />
      </div>
    </div>
  );
}

// Pulse dot for status indicators
export function PulseDot({ color = "green" }: { color?: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-green-400",
    yellow: "bg-yellow-400",
    red: "bg-red-400",
  };

  return (
    <span className="relative flex h-2 w-2">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`}
      />
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${colors[color]}`}
      />
    </span>
  );
}
