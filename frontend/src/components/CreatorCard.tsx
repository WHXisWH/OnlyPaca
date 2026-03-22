"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { Creator } from "@/types";

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const priceInEth = formatEther(BigInt(creator.subscriptionPrice));

  return (
    <Link href={`/creator/${creator.address}`}>
      <div className="glass rounded-2xl overflow-hidden hover:bg-white/10 transition-all group cursor-pointer">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-primary-600/30 to-purple-600/30 relative">
          {creator.banner && (
            <img
              src={creator.banner}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Avatar */}
        <div className="relative px-4">
          <div className="absolute -top-8 left-4">
            <div className="w-16 h-16 rounded-full bg-dark-700 border-4 border-dark-900 overflow-hidden">
              {creator.avatar ? (
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {creator.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 pb-4 px-4">
          {/* Name */}
          <h3 className="text-lg font-semibold text-white truncate">
            {creator.name}
          </h3>

          {/* Bio */}
          <p className="text-dark-400 text-sm mt-1 line-clamp-2 h-10">
            {creator.bio || "No bio yet"}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
            {/* Subscribers */}
            <div className="flex items-center text-dark-400">
              <svg
                className="w-4 h-4 mr-1"
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
              <span className="text-sm">{creator.subscriberCount}</span>
            </div>

            {/* Price */}
            <div className="flex items-center">
              <span className="text-primary-400 font-semibold">
                {parseFloat(priceInEth).toFixed(4)} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="h-1 bg-gradient-to-r from-primary-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      </div>
    </Link>
  );
}
