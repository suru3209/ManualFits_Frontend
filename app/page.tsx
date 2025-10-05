import HeroSection from "@/components/layout/HeroSection";
import { Skiper29 } from "@/components/ui/skiper-ui/skiper29";

export default function SiteHome() {
  return (
    <>
      {/* herosection */}
      <div className="bg-[#f9f7ef] flex flex-col justify-center items-center text-center h-auto pt-25 lg:pt-30">
        <HeroSection />
        <p className="font-bold text-2xl">Fits Your Style Perfectly with </p>
        <h1 className="font-custom mb-10 w-full cursor-pointer text-center text-4xl leading-[0.9] opacity-60 transition-all ease-in-out hover:opacity-100">
          MANUAL-FITS
        </h1>
      </div>
      <div className="">
        <Skiper29 />
      </div>
    </>
  );
}
