"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreatorCard } from "@/components/CreatorCard";
import { useCreators } from "@/hooks/useCreators";

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
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-dark-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No creators found
              </h3>
              <p className="text-dark-400">
                {searchQuery
                  ? "Try a different search term"
                  : "Be the first to register as a creator!"}
              </p>
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
