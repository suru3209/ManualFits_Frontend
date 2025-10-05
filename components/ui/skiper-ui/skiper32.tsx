"use client";

import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis } from "lenis/react";
import React, { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const Skiper32 = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }
  }, []);

  return (
    <div className="h-full w-screen">
      {/* <WithGsap /> */}
      <WithFramerMotion />
    </div>
  );
};

const WithFramerMotion = () => {
  const targetRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const images = [
    "https://plus.unsplash.com/premium_photo-1669688174622-0393f5c6baa2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1552168212-9ceb61083ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1669688174622-0393f5c6baa2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1552168212-9ceb61083ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1669688174622-0393f5c6baa2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1552168212-9ceb61083ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  return (
    <ReactLenis root>
      <div ref={targetRef} className="relative z-0 h-[300vh]">
        {/* <div className="top-22 absolute left-1/2 z-10 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
          <span className="after:from-background after:to-foreground relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:content-['']">
            Scroll effect with motion.dev
          </span>
        </div> */}
        <div
          className="sticky top-0 grid h-screen grid-cols-5 grid-rows-4 gap-2"
          style={{
            transformStyle: "preserve-3d",
            perspective: "200px",
          }}
        >
          {images.map((src, index) => (
            <div key={index} className="relative group">
              {/* Image Component */}
              <GridShowRandom
                scrollYProgress={scrollYProgress}
                imgSrc={src}
                randomValues={randomValues[index]}
              />

              {/* Overlay + Heart Icon */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <button className="bg-white rounded-full p-3 shadow-md hover:scale-110 transition-transform">
                  ❤️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ReactLenis>
  );
};

interface GridShowRandomProps {
  scrollYProgress: MotionValue<number>;
  imgSrc: string;
  randomValues: {
    rotateXStart: number;
    translateZStart: number;
    translateYStart: number;
    progressEnd: number;
  };
}

const GridShowRandom = ({
  scrollYProgress,
  imgSrc,
  randomValues,
}: GridShowRandomProps) => {
  const rotateX = useTransform(
    scrollYProgress,
    [0, randomValues.progressEnd],
    [randomValues.rotateXStart, 0]
  );

  const translateZ = useTransform(
    scrollYProgress,
    [0, randomValues.progressEnd],
    [randomValues.translateZStart, 0]
  );

  const translateY = useTransform(
    scrollYProgress,
    [0, randomValues.progressEnd],
    [randomValues.translateYStart, 0]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, randomValues.progressEnd],
    [0, 1]
  );

  return (
    <motion.img
      style={{
        rotateX,
        translateY,
        translateZ,
        opacity,
      }}
      src={imgSrc}
      className="h-full w-full object-cover"
    />
  );
};

// Hardcoded random values for each image with different scroll progress endpoints
const randomValues = [
  {
    rotateXStart: -45,
    translateZStart: -450,
    translateYStart: 2150,
    progressEnd: 0.7,
  },
  {
    rotateXStart: -67,
    translateZStart: -720,
    translateYStart: 1720,
    progressEnd: 1,
  },
  {
    rotateXStart: -38,
    translateZStart: -380,
    translateYStart: 1380,
    progressEnd: 0.8,
  },
  {
    rotateXStart: -82,
    translateZStart: -890,
    translateYStart: 1890,
    progressEnd: 0.9,
  },
  {
    rotateXStart: -53,
    translateZStart: -540,
    translateYStart: 2540,
    progressEnd: 1,
  },
  {
    rotateXStart: -71,
    translateZStart: -760,
    translateYStart: 1760,
    progressEnd: 1,
  },
  {
    rotateXStart: -42,
    translateZStart: -420,
    translateYStart: 1420,
    progressEnd: 0.75,
  },
  {
    rotateXStart: -89,
    translateZStart: -950,
    translateYStart: 1950,
    progressEnd: 0.85,
  },
  {
    rotateXStart: -48,
    translateZStart: -480,
    translateYStart: 1480,
    progressEnd: 0.7,
  },
  {
    rotateXStart: -75,
    translateZStart: -800,
    translateYStart: 1800,
    progressEnd: 0.8,
  },
  {
    rotateXStart: -35,
    translateZStart: -350,
    translateYStart: 1350,
    progressEnd: 0.8,
  },
  {
    rotateXStart: -85,
    translateZStart: -920,
    translateYStart: 1920,
    progressEnd: 0.9,
  },
  {
    rotateXStart: -58,
    translateZStart: -580,
    translateYStart: 1580,
    progressEnd: 0.65,
  },
  {
    rotateXStart: -69,
    translateZStart: -740,
    translateYStart: 1740,
    progressEnd: 1,
  },
  {
    rotateXStart: -44,
    translateZStart: -440,
    translateYStart: 1440,
    progressEnd: 0.75,
  },
  {
    rotateXStart: -78,
    translateZStart: -830,
    translateYStart: 1830,
    progressEnd: 0.95,
  },
  {
    rotateXStart: -51,
    translateZStart: -510,
    translateYStart: 1510,
    progressEnd: 0.7,
  },
  {
    rotateXStart: -87,
    translateZStart: -940,
    translateYStart: 1940,
    progressEnd: 0.8,
  },
  {
    rotateXStart: -39,
    translateZStart: -390,
    translateYStart: 1390,
    progressEnd: 1,
  },
  {
    rotateXStart: -73,
    translateZStart: -780,
    translateYStart: 1780,
    progressEnd: 0.85,
  },
];

const WithGsap = ({ className }: { className?: string }) => {
  const mainRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const gridFullRef = useRef<HTMLDivElement>(null);

  // Image data - using available images from the project
  const images = [
    "https://plus.unsplash.com/premium_photo-1669688174622-0393f5c6baa2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1552168212-9ceb61083ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1669688174622-0393f5c6baa2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1552168212-9ceb61083ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1669688174622-0393f5c6baa2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1552168212-9ceb61083ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  const animateTextElement = () => {
    if (!textRef.current) return;

    const chars = textRef.current.querySelectorAll(".char");

    gsap
      .timeline({
        scrollTrigger: {
          trigger: textRef.current,
          start: "top bottom",
          end: "center center-=25%",
          scrub: true,
        },
      })
      .from(chars, {
        ease: "sine",
        yPercent: 300,
        autoAlpha: 0,
        stagger: {
          each: 0.04,
          from: "center",
        },
      });
  };

  const animateGridFull = () => {
    if (!gridFullRef.current) return;

    const gridFullItems =
      gridFullRef.current.querySelectorAll(".grid-full-item");
    const numColumns = 7; // Based on grid-cols-7
    const middleColumnIndex = Math.floor(numColumns / 2);

    // Organize items by columns
    const columns: Element[][] = Array.from({ length: numColumns }, () => []);
    gridFullItems.forEach((item, index) => {
      const columnIndex = index % numColumns;
      columns[columnIndex].push(item);
    });

    // Animate each column
    columns.forEach((columnItems, columnIndex) => {
      const delayFactor = Math.abs(columnIndex - middleColumnIndex) * 0.2;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: gridFullRef.current,
            start: "top bottom",
            end: "center center",
            scrub: true,
          },
        })
        .from(columnItems, {
          yPercent: 450,
          autoAlpha: 0,
          delay: delayFactor,
          ease: "sine",
        })
        .from(
          columnItems.map((item) => item.querySelector(".grid-item-img")),
          {
            transformOrigin: "50% 0%",
            ease: "sine",
          },
          0
        );
    });
  };

  useEffect(() => {
    const init = () => {
      animateTextElement();
      animateGridFull();
    };

    // Simulate image preloading
    const timer = setTimeout(() => {
      init();
      window.scrollTo(0, 0);
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.killAll();
    };
  }, []);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div ref={mainRef} className="relative w-full overflow-hidden">
        {/* Intro Section */}
        <div className="top-22 absolute left-1/2 z-10 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
          <span className="after:from-background after:to-foreground relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:content-['']">
            Scroll Effect with GSAP
          </span>
        </div>

        {/* Full Grid Section */}
        <section className="relative mt-40 grid w-full place-items-center">
          <div
            ref={gridFullRef}
            className="my-[10vh] grid aspect-[1.5] h-auto w-full grid-cols-7 grid-rows-5 gap-4 p-4"
          >
            {images.slice(0, 35).map((img, index) => (
              <figure
                key={index}
                className="grid-full-item relative z-10"
                style={{
                  perspective: "800px",
                  willChange: "transform",
                }}
              >
                <div
                  className="grid-item-img backface-hidden h-full w-full rounded bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${img})`,
                    willChange: "transform",
                  }}
                />
              </figure>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export { Skiper32, WithFramerMotion, WithGsap };

/**
 * Skiper 32 ScrollAnimation_003 — React + framer motion + Gsap + lenis
 * Inspired by and adapted from https://tympanus.net/codrops/demos/
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 * These animations aren’t associated with the tympanus.net . They’re independent recreations meant to study interaction design
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
