"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreatorCard } from "@/components/CreatorCard";
import { useCreators } from "@/hooks/useCreators";
import { SystemStatusPanel } from "@/components/SystemStatusPanel";

export default function ExplorePage() {
  const { creators, isLoading, error } = useCreators();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"subscribers" | "price">("subscribers");

  // Filter and sort creators
  const filteredCreators = creators
    .filter((creator) =>
      creator.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "subscribers") {
        return Number(b.subscriberCount) - Number(a.subscriberCount);
      }
      return Number(a.subscriptionPrice) - Number(b.subscriptionPrice);
    });

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Explore Creators
            </h1>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Discover amazing creators and subscribe with complete privacy.
              Your subscription relationships are encrypted on-chain.
            </p>
          </div>

          <div className="mb-8">
            <SystemStatusPanel
              compact
              title="Private Flow Readiness"
              description="Quick live check before you subscribe: relayer reachability, contract readiness, and wallet network alignment."
            />
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "subscribers" | "price")}
              className="px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
            >
              <option value="subscribers">Most Subscribers</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-dark-400">Loading creators...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="text-red-400 mb-4">Failed to load creators</div>
              <p className="text-dark-400 text-sm">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredCreators.length === 0 && (
            <div className="py-20">
              {searchQuery ? (
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">No results for &quot;{searchQuery}&quot;</h3>
                  <p className="text-dark-400">Try a different search term.</p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No creators yet — be the first</h3>
                  <p className="text-dark-400 mb-8 max-w-md mx-auto">
                    OnlyPaca is live on Arbitrum Sepolia. Register as a creator, set your price, and start earning with fully encrypted revenue.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/dashboard/creator"
                      className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-white glow-hover transition-all hover:scale-105"
                    >
                      Become a Creator
                    </a>
                    <a
                      href="/dashboard"
                      className="px-8 py-3 glass rounded-xl font-semibold text-white hover:bg-white/10 transition-all"
                    >
                      Go to Dashboard
                    </a>
                  </div>

                  {/* How it works mini */}
                  <div className="mt-12 grid sm:grid-cols-3 gap-6 text-left">
                    {[
                      { n: "01", title: "Register", desc: "Set your name, price, and a content URL. One transaction on Arbitrum Sepolia." },
                      { n: "02", title: "Subscribers pay privately", desc: "Fans sign a message — no gas. The relayer pays gas on their behalf." },
                      { n: "03", title: "Withdraw encrypted revenue", desc: "Your earnings accumulate encrypted via FHE. Only you can decrypt and withdraw." },
                    ].map((item) => (
                      <div key={item.n} className="glass rounded-xl p-4">
                        <div className="text-primary-400 font-bold text-sm mb-2">{item.n}</div>
                        <div className="text-white font-semibold mb-1">{item.title}</div>
                        <div className="text-dark-400 text-sm">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Creator Grid */}
          {!isLoading && !error && filteredCreators.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map((creator) => (
                <CreatorCard key={creator.address} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
