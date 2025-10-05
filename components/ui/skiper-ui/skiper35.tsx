"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface Project {
  id: number;
  label: string;
  year: string;
  image: string;
}

const projects: Project[] = [
  {
    id: 1,
    label: "Velvet ® Dreams Studio",
    year: "2024",
    image:
      "https://plus.unsplash.com/premium_photo-1668485968642-30e3d15e9b9c?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    label: "Neon Pulse ® Agency",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1619042220193-1764e5a87fce?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    label: "Midnight Canvas",
    year: "2024",
    image:
      "https://plus.unsplash.com/premium_photo-1726098114660-41795e9ac7b3?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 4,
    label: "Echo Digital Lab",
    year: "2024",
    image:
      "https://plus.unsplash.com/premium_photo-1697183203538-08c30b0a6709?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 5,
    label: "Skiper Creative ® Co ",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1577696427544-c9249414cfd0?q=80&w=971&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 6,
    label: "Cosmic Brew Studios",
    year: "2023—2024",
    image:
      "https://images.unsplash.com/photo-1578835187997-017d9952f020?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 7,
    label: "Horizon Typography",
    year: "2024",
    image:
      "https://images.unsplash.com/photo-1741939483735-6923b430ca89?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 8,
    label: "Waves & ® Motion",
    year: "2022—2024",
    image:
      "https://images.unsplash.com/photo-1630933109834-37b8a0c7cb42?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjMxfHxvdXRmaXR8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 9,
    label: "Stellar Workshop",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1586024452802-86e0d084a4f9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTg3fHxvdXRmaXR8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 10,
    label: "Prism ® Media House",
    year: "2023",
    image:
      "https://plus.unsplash.com/premium_photo-1675253119026-b1c8b2802ce1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTgxfHxvdXRmaXR8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 11,
    label: "Aurora Design Co ™ ",
    year: "2023",
    image:
      "https://plus.unsplash.com/premium_photo-1671638524511-bbd6d4e05bc1?q=80&w=1286&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 12,
    label: "Flux Interactive",
    year: "2023",
    image:
      "https://images.unsplash.com/photo-1666932521085-447127f3dcff?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU5fHxvdXRmaXR8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 13,
    label: "Ember Creative Lab ™",
    year: "2022",
    image:
      "https://images.unsplash.com/photo-1647073952905-e74b2e1c2005?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODN8fG91dGZpdHxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: 14,
    label: "Zenith Brand Studio",
    year: "2024",
    image:
      "https://plus.unsplash.com/premium_photo-1690366910345-5807bf328585?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzd8fG91dGZpdHxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: 15,
    label: "Quantum Visual Arts",
    year: "2022—2023",
    image:
      "https://plus.unsplash.com/premium_photo-1726098114545-7f152c88936a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDV8fG91dGZpdHxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: 16,
    label: "Quantum Visual Arts",
    year: "2022—2023",
    image:
      "https://images.unsplash.com/photo-1583002083769-0bd781675d2f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDJ8fG91dGZpdHxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    id: 17,
    label: "Quantum Visual Arts",
    year: "2022—2023",
    image:
      "https://plus.unsplash.com/premium_photo-1725914368819-e30f9fb7db70?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjV8fG91dGZpdHxlbnwwfHwwfHx8MA%3D%3D",
  },
];

import useMediaQuery from "@mui/material/useMediaQuery";

const Skiper35 = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(15);
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <section className="h-full w-full bg-[#121212] text-[#F1F1F1]">
      <div className="overflow-hidden md:h-full">
        <motion.div className="mx-auto flex w-full flex-col md:h-full md:flex-row lg:min-w-[1600px]">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              className="lg:border-r-1 relative h-full w-full cursor-pointer border-0 border-white/30"
              onClick={isMobile ? () => setSelectedIndex(index) : undefined}
              onMouseEnter={
                !isMobile ? () => setSelectedIndex(index) : undefined
              }
              initial={
                isMobile
                  ? { height: "4rem", width: "100%" }
                  : { width: "4rem", height: "100%" }
              }
              animate={
                isMobile
                  ? {
                      height: selectedIndex === index ? "500px" : "4rem",
                      width: "100%",
                    }
                  : { width: selectedIndex === index ? "28rem" : "4rem" }
              }
              transition={{ stiffness: 200, damping: 25, type: "spring" }}
            >
              <motion.div
                className="absolute bottom-0 left-[2vw] flex w-[calc(100vh-2.6vw)] origin-[0_50%] transform justify-between pr-5 text-xl font-medium leading-[2.6vw] tracking-[-0.03em] md:-rotate-90 md:text-[2vw]"
                animate={{
                  color:
                    selectedIndex === index
                      ? "#F1F1F1"
                      : "rgba(241, 241, 241, 0.3)",
                }}
                transition={{ duration: 0.3 }}
              >
                <p className="label w-full border-b py-2 md:w-auto md:border-0 md:py-0">
                  {project.label}
                </p>
                <AnimatePresence>
                  {selectedIndex === index && (
                    <motion.p
                      className="year"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {project.year}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 1 }}
                animate={{
                  opacity: selectedIndex === index ? 1 : 0,
                }}
                className="h-[92%] rounded-[0.6vw] object-cover pl-2 pr-[1.3vw] pt-[1.3vw] md:h-[100%] md:pb-[1.3vw] md:pl-[4vw]"
              >
                <motion.img
                  src={project.image}
                  alt={project.label}
                  className="w-full rounded-xl"
                  style={{ height: "100%", objectFit: "cover" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export { Skiper35 };

/**
 * Skiper 35 HoverExpand — React + framer motion
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
