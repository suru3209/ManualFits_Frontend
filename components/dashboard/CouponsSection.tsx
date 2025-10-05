"use client";

import React from "react";
import { Gift } from "lucide-react";

export default function CouponsSection() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Gift Cards & Coupons</h2>
      <div className="text-center py-8">
        <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No coupons available</p>
        <p className="text-gray-400">Your coupons will appear here</p>
      </div>
    </div>
  );
}
