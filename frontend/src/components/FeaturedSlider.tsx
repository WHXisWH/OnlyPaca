"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const featuredContent = [
  {
    id: 1,
    title: "Midnight Temptation",
    creator: "SensualWhisper",
    contentType: "PHOTO",
    price: "0.01 ETH",
    fans: "12.4K",
    trendScore: 96,
    image: "/images/featured/content-1.jpg",
  },
  {
    id: 2,
    title: "Private Desires",
    creator: "ExoticBeauty",
    contentType: "VIDEO",
    price: "0.008 ETH",
    fans: "8.7K",
    trendScore: 92,
    image: "/images/featured/content-2.jpg",
  },
  {
    id: 3,
    title: "Whispers in Lace",
    creator: "LaceGoddess",
    contentType: "PHOTO",
    price: "0.015 ETH",
    fans: "21.1K",
    trendScore: 94,
    image: "/images/featured/content-3.jpg",
  },
];

export function FeaturedSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featuredContent.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const item = featuredContent[current];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-dark-400 text-sm uppercase tracking-widest mb-2">Hot Right Now</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Featured <span className="gradient-text">on OnlyPaca</span>
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto h-[420px] sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          {featuredContent.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === current ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                priority={index === 0}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Lock overlay — content is private until subscribed */}
              <div className="absolute inset-0 backdrop-blur-[2px] bg-black/10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary-600/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {item.contentType}
                      </span>
                      <span className="bg-black/40 backdrop-blur-sm text-white/70 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {item.trendScore}% trending
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-white/60 text-sm">by @{item.creator} · {item.fans} subscribers</p>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className="text-white font-bold text-xl">{item.price}<span className="text-white/50 text-sm">/mo</span></span>
                    <Link
                      href="/explore"
                      className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl text-white font-semibold text-sm hover:scale-105 transition-transform glow-hover"
                    >
                      Subscribe
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slide dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {featuredContent.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current ? "w-6 bg-primary-400" : "w-2 bg-white/40"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
