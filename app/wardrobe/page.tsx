import { Skiper35 } from "@/components/ui/skiper-ui/skiper35";
import React from "react";
import DynamicBreadcrumb from "@/lib/breadcrumb";

const wardrobe = () => {
  return (
    <div className="mt-15 lg:h-screen">
      <DynamicBreadcrumb />
      <Skiper35 />
    </div>
  );
};

export default wardrobe;
