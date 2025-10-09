"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import ReactLenis from "lenis/react";
import React, { useRef } from "react";
import Link from "next/link";

const Skiper29 = () => {
  const gallery = useRef(null);
  const gallery2 = useRef(null);

  const { scrollYProgress } = useScroll({
    target: gallery,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress: scrollYProgress2 } = useScroll({
    target: gallery2,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0.6, 1], ["0%", "30%"]);

  const scaleDiv = useTransform(scrollYProgress2, [0, 1], [1, 0.7]);
  const scaleImg = useTransform(scrollYProgress2, [0, 1], [1, 1.3]);

  return (
    <ReactLenis root>
      <div className="flex w-screen flex-col items-center overflow-hidden bg-[#F9F7EF] text-black">
        <div
          ref={gallery}
          className="relative flex h-[70vh] w-screen items-end overflow-hidden"
        >
          <div className="absolute left-10 top-10 z-30 flex items-center justify-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#F9F7EF] p-2 text-black">
              <ArrowWeired className="rotate-90" />{" "}
            </div>
            <p className="font-roman md:text-md text-xs uppercase tracking-widest text-[#F9F7EF]">
              All work
            </p>
          </div>
          <div className="absolute left-0 top-0 z-10 h-1/2 w-full bg-gradient-to-t from-transparent to-black/90" />
          <motion.img
            src="https://images.pexels.com/photos/322207/pexels-photo-322207.jpeg?cs=srgb&dl=pexels-lum3n-44775-322207.jpg&fm=jpg"
            alt=""
            className="h-screen w-full object-cover"
            style={{ y }}
          />
        </div>
        <div className="flex w-full flex-col items-center justify-center">
          <p className="font-roman md:text-md my-10 text-sm tracking-widest">
            OUR
          </p>
          <Link href="/products">
            <h1 className="font-custom h-8.5 lg:h-17 w-full border-b border-t text-center text-5xl leading-[0.9] lg:text-8xl">
              COLLECTIONS
            </h1>
          </Link>
          <div className="my-4 flex size-8 items-center justify-center rounded-full bg-black p-2 text-[#F9F7EF]">
            <ArrowWeired />
          </div>
        </div>

        <motion.div
          ref={gallery2}
          style={{ scale: scaleDiv, clipPath: "url(#video)" }}
          className="mt-35 relative flex aspect-video w-full items-center justify-center overflow-hidden lg:w-[80%]"
        >
          <div className="absolute z-20 size-full bg-black/15" />
          {/* <PlayButton /> */}
          <div className="w-100  z-100 ml-125 rounded-full bg-[#f9f7ef]">
            <Link href="/">
              <img src="./logo2.png" className="w-40" alt="manualfits logo" />
            </Link>
          </div>
          <SvgMask />
          <motion.img
            src="https://images.pexels.com/photos/322207/pexels-photo-322207.jpeg?cs=srgb&dl=pexels-lum3n-44775-322207.jpg&fm=jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ scale: scaleImg }}
          />
        </motion.div>

        <div className="mt-32 flex w-full flex-col items-center justify-center uppercase">
          <h1 className="font-custom h-8.5 lg:h-17 w-full border-t text-center text-5xl leading-[0.9] lg:text-8xl">
            Essentials
          </h1>
          <h1 className="font-custom h-8.5 lg:h-17 w-full border-t text-center text-5xl leading-[0.9] lg:text-8xl">
            Trends
          </h1>
          <h1 className="font-custom h-8.5 lg:h-17 w-full border-b border-t text-center text-5xl leading-[0.9] lg:text-8xl">
            Lookbook
          </h1>
        </div>

        <div className="my-42 flex flex-col items-center justify-center uppercase">
          <p className="font-roman md:text-md my-6 text-sm tracking-widest">
            sitemap
          </p>
          <Link href="/wardrobe">
            <h1 className="font-custom w-full cursor-pointer text-center text-4xl leading-[0.9] opacity-20 transition-all ease-in-out hover:opacity-100">
              Wardrobe
            </h1>
          </Link>
          <Link href="/privacy">
            <h1 className="font-custom w-full cursor-pointer text-center text-4xl leading-[0.9] opacity-20 transition-all ease-in-out hover:opacity-100">
              about
            </h1>
          </Link>
          <Link href="/privacy">
            <h1 className="font-custom w-full cursor-pointer text-center text-4xl leading-[0.9] opacity-20 transition-all ease-in-out hover:opacity-100">
              contact
            </h1>
          </Link>
          <Link href="/privacy">
            <h1 className="font-custom w-full cursor-pointer text-center text-4xl leading-[0.9] opacity-20 transition-all ease-in-out hover:opacity-100">
              privacy
            </h1>
          </Link>
        </div>
      </div>
    </ReactLenis>
  );
};

export { Skiper29 };

const SvgMask = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 1836 1053"
      width="100%"
    >
      <clipPath id="video" clipPathUnits="objectBoundingBox">
        <path
          fill="currentColor"
          d="M457.525 1.148c-20.789-3.198-193.979 1.16-283.854 2.496 11.104-.178 1.297-2.868-81.146-2.496-103.5.468-86 102.499-86 109.999s-7 524.5-6.5 547.5 10 59 6.5 99c-2.8 32-1.167 234.667 0 332.003.5 75 62.5 66.5 67 68.5s38.5 0 81.5 0 436 6 526 10.5 438.995-.5 505.495 0 330.01-12.5 417.51-12.5 230.99 2 270.99 0 40.5-16 51-31.5 12.5-61 12.5-105.5c0-44.503 7.01-274.504 7.01-348.004s-3.51-159.998-7.01-230.998 0-256.002 0-318.002 7.01-92.998-22.5-110.999c-18.79-11.471-81.99-9.999-133.49-9.999H853.525c-29 0-370 4-396 0Z"
          transform="scale(0.0005139987561, 0.0008543065594)"
        ></path>
      </clipPath>
    </svg>
  );
};

const ArrowWeired = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 100 100"
      width="100%"
      className={className}
    >
      <path
        fill="currentColor"
        d="M69.022 85.363c16.693-13.32 20.658-33.261 20.16-43.736H77.95c0 17.454-11.106 29.106-20.543 35.517-4.676 3.177-10.818 2.998-15.414-.293-17.124-12.264-19.958-27.753-18.988-35.224H10.305c0 20.438 9.697 34.444 20.244 43.16 11.033 9.118 27.285 9.503 38.473.576Z"
      ></path>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M56.016 5v79.243H43.56V5h12.455Z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

const PlayButton = () => {
  return (
    <div className="absolute z-20 flex scale-50 flex-col items-center justify-center gap-3 text-center text-red-500 lg:scale-100">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 100 100"
        width="100%"
        className="svg size-25"
      >
        <path
          fill="currentColor"
          d="M80.593 43.765c4.543 3.072 4.543 9.762 0 12.834L28.219 92.021c-5.145 3.48-12.087-.206-12.087-6.417V14.76c0-6.21 6.942-9.897 12.087-6.417l52.374 35.422Z"
        ></path>
      </svg>
      <p className="font-roman md:text-md text-sm uppercase tracking-widest">
        ACTION
      </p>
      <h1 className="font-custom text-4xl uppercase leading-[0.9]">
        watch <br /> trailer
      </h1>
    </div>
  );
};

/**
 * Skiper 29 Parallax_001 — React + framer motion + lenis
 * Inspired by and adapted from https://www.siena.film/films/my-project-x
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 * These animations aren’t associated with the siena.film . They’re independent recreations meant to study interaction design
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.in
 * Twitter: https://x.com/Gur__vi
 */
