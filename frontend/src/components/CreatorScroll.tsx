"use client";

import Image from "next/image";

// Mix of real images and gradient-only cards to avoid obvious 3-image loop
const creators = [
  { name: "Luna Cipher",   tag: "@lunacph",   subscribers: "12.4K", price: "0.01 ETH",  image: "/images/featured/content-1.jpg", gradient: null },
  { name: "Aria Veil",     tag: "@ariaveil",  subscribers: "8.7K",  price: "0.008 ETH", image: null, gradient: "from-violet-700 via-fuchsia-600 to-pink-600" },
  { name: "Nova Shade",    tag: "@novashd",   subscribers: "21.1K", price: "0.015 ETH", image: "/images/featured/content-2.jpg", gradient: null },
  { name: "Mira Onyx",     tag: "@miraonyx",  subscribers: "5.3K",  price: "0.005 ETH", image: null, gradient: "from-rose-700 via-pink-600 to-fuchsia-700" },
  { name: "Zara Dusk",     tag: "@zaradusk",  subscribers: "33.9K", price: "0.02 ETH",  image: "/images/featured/content-3.jpg", gradient: null },
  { name: "Ivy Noir",      tag: "@ivynoir",   subscribers: "9.2K",  price: "0.012 ETH", image: null, gradient: "from-pink-700 via-rose-600 to-orange-600" },
  { name: "Ember Lux",     tag: "@emberlux",  subscribers: "15.6K", price: "0.018 ETH", image: "/images/featured/content-1.jpg", gradient: null },
  { name: "Celeste X",     tag: "@celestex",  subscribers: "44.2K", price: "0.025 ETH", image: null, gradient: "from-indigo-700 via-violet-600 to-purple-700" },
  { name: "Roxie Dark",    tag: "@roxiedark", subscribers: "7.1K",  price: "0.009 ETH", image: "/images/featured/content-2.jpg", gradient: null },
  { name: "Seraphina",     tag: "@seraph",    subscribers: "18.3K", price: "0.022 ETH", image: null, gradient: "from-fuchsia-700 via-pink-500 to-rose-600" },
];

function CreatorCard({ creator }: { creator: typeof creators[0] }) {
  return (
    <div className="relative flex-shrink-0 w-64 rounded-2xl overflow-hidden group cursor-pointer border border-white/5 hover:border-primary-500/30 transition-colors duration-300">
      {/* Background: real image or gradient */}
      <div className="h-80 relative">
        {creator.image ? (
          <Image src={creator.image} alt={creator.name} fill className="object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${creator.gradient}`} />
        )}

        {/* Blur/lock overlay */}
        <div className="absolute inset-0 backdrop-blur-[3px] bg-black/25" />

        {/* Lock */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/15 group-hover:border-primary-400/50 group-hover:bg-primary-500/20 transition-all duration-300">
            <svg className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex-shrink-0 border border-white/20 ${creator.gradient ? `bg-gradient-to-br ${creator.gradient}` : 'bg-primary-600'}`} />
          <div>
            <div className="text-white text-sm font-semibold">{creator.name}</div>
            <div className="text-white/40 text-xs">{creator.tag}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-xs">{creator.subscribers} subscribers</span>
          <span className="text-primary-400 text-xs font-semibold">{creator.price}/mo</span>
        </div>
      </div>
    </div>
  );
}

export function CreatorScroll() {
  const doubled = [...creators, ...creators];

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
        <p className="text-dark-500 text-xs uppercase tracking-[0.2em] mb-3">Trending Now</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Subscribe <span className="gradient-text">without a trace</span>
        </h2>
      </div>

      {/* Single row — wider cards, more gap, slower scroll */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-dark-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-dark-950 to-transparent z-10 pointer-events-none" />

        <div className="flex gap-5 animate-marquee-left">
          {doubled.map((c, i) => (
            <CreatorCard key={i} creator={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
