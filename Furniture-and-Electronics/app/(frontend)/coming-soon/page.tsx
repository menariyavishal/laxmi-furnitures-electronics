"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Shrikhand, Plus_Jakarta_Sans } from "next/font/google";

const shrikhand = Shrikhand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-shrikhand",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

export default function LaxmiComingSoon() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [nameRevealed, setNameRevealed] = useState<boolean>(false);
  const [productsRevealed, setProductsRevealed] = useState<boolean>(false);

  // 1. When bunny finishes pointing -> Shop Name reveals
  const NAME_POINT_TIMESTAMP = 1.6;
  // 2. Staggered Entrance -> Products pop up onto ground
  const PRODUCTS_TIMESTAMP = 2.2;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;

      if (time >= NAME_POINT_TIMESTAMP && !nameRevealed) {
        setNameRevealed(true);
      }
      if (time >= PRODUCTS_TIMESTAMP && !productsRevealed) {
        setProductsRevealed(true);
      }
    }
  };

  return (
    <main
      className={`fixed inset-0 h-screen max-h-screen w-screen max-w-full overflow-hidden bg-[#a81324] text-white select-none ${shrikhand.variable} ${jakarta.className}`}
    >
      {/* ================= 1. VIDEO LAYER (SEAMLESS FULL-BLEED, BUNNY ON RIGHT) ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#a81324]">
        <video
          ref={videoRef}
          src="https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/cloudinarry%20to%20cloudflare/202606021731-e_hqa6sn.mp4"
          playsInline
          autoPlay
          muted
          loop={false}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setNameRevealed(true);
            setProductsRevealed(true);
          }}
          className="h-full w-full object-cover object-right md:object-[80%_center]"
        />
        {/* Subtle Dark Vignette after reveal to ensure text contrast */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            nameRevealed ? "opacity-100 bg-black/15" : "opacity-0"
          }`}
        />
      </div>

      {/* ================= 2. SHOP NAME + ENLARGED TV CLOSE TO LAXMI ================= */}
      <div
        className={`absolute left-4 sm:left-8 md:left-12 lg:left-16 top-[28%] sm:top-[30%] md:top-[32%] -translate-y-1/2 z-20 transition-all duration-700 transform ease-out ${
          nameRevealed
            ? "opacity-100 translate-x-0 scale-100"
            : "opacity-0 -translate-x-12 scale-90 pointer-events-none"
        }`}
      >
        {/* Row with Laxmi Title + Big TV Close to Laxmi */}
        <div className="flex items-center gap-3 sm:gap-5 md:gap-7">
          <h1
            className="font-[family-name:var(--font-shrikhand)] text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-[#FFFBF2] tracking-tight leading-[0.95] text-left shrink-0"
            style={{
              textShadow: `
                0px 4px 0px #e64f00,
                0px 8px 0px #b83a00,
                0px 14px 2px #732200,
                0px 20px 24px rgba(0, 0, 0, 0.6)
              `,
            }}
          >
            Laxmi
          </h1>

          {/* Smart 4K TV: Enlarged and positioned right close to Laxmi */}
          <div
            className={`transition-all duration-800 delay-150 transform ${
              productsRevealed
                ? "opacity-100 translate-y-0 scale-100 rotate-[-2deg]"
                : "opacity-0 translate-y-6 scale-75 pointer-events-none"
            }`}
          >
            <Image
              src="/design-logos/tv.png"
              alt="4K OLED Smart TV"
              width={420}
              height={260}
              priority
              className="w-auto h-20 sm:h-28 md:h-36 lg:h-44 xl:h-48 object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.65)] hover:scale-105 transition-transform duration-300"
            />
            {/* Soft Shadow Under Floating TV */}
            <div className="w-3/4 h-2.5 bg-black/40 rounded-full blur-[4px] mx-auto -mt-1 pointer-events-none" />
          </div>
        </div>

        {/* Subtitle */}
        <h2
          className="font-[family-name:var(--font-shrikhand)] text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#FFECCC] tracking-wide text-left mt-2 sm:mt-3 pr-2"
          style={{
            textShadow: `
              0px 3px 0px #d44300,
              0px 6px 0px #9e2e00,
              0px 12px 16px rgba(0, 0, 0, 0.5)
            `,
          }}
        >
          Furniture & Electronics
        </h2>
      </div>

      {/* ================= 3. GROUND PRODUCTS: SOFA, CHAIR & FRIDGE AT #4 (CLEARS BUNNY'S HAND) ================= */}
      <div
        className={`absolute bottom-4 sm:bottom-6 md:bottom-8 left-2 sm:left-4 md:left-6 lg:left-8 z-20 flex items-end gap-2.5 sm:gap-4 md:gap-5 transition-all duration-800 ease-out transform ${
          productsRevealed
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-16 scale-90 pointer-events-none"
        }`}
      >
        {/* 1. Boucle Sofa */}
        <div className="relative group flex flex-col items-center flex-shrink-0">
          <Image
            src="/design-logos/sofa.png"
            alt="Luxury Curved Sofa"
            width={380}
            height={190}
            priority
            className="w-auto h-18 sm:h-24 md:h-30 lg:h-36 object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
          />
          {/* Ground Contact Shadow */}
          <div className="w-4/5 h-3 bg-black/50 rounded-full blur-[4px] pointer-events-none -mt-1.5" />
        </div>

        {/* 2. Velvet Armchair */}
        <div className="relative group flex flex-col items-center flex-shrink-0">
          <Image
            src="/design-logos/armchair.png"
            alt="Modern Armchair"
            width={260}
            height={200}
            priority
            className="w-auto h-16 sm:h-22 md:h-26 lg:h-32 object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
          />
          {/* Ground Contact Shadow */}
          <div className="w-4/5 h-3 bg-black/50 rounded-full blur-[4px] pointer-events-none -mt-1.5" />
        </div>

        {/* 4. Smart Refrigerator (At #4 Position, Sized and Positioned Safely Below Bunny's Hand) */}
        <div className="relative group flex flex-col items-center flex-shrink-0">
          <Image
            src="/design-logos/fridge.png"
            alt="Smart Multi-Door Refrigerator"
            width={260}
            height={360}
            priority
            className="w-auto h-28 sm:h-40 md:h-52 lg:h-64 xl:h-[290px] object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,0.65)] transition-transform duration-300 group-hover:scale-105"
          />
          {/* Ground Contact Shadow */}
          <div className="w-4/5 h-3.5 bg-black/55 rounded-full blur-[4px] pointer-events-none -mt-1.5" />
        </div>
      </div>
    </main>
  );
}
