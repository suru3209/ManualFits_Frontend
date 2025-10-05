"use client";

import React from "react";
import { Star } from "lucide-react";

export default function ReviewsSection() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Reviews & Ratings</h2>
      <div className="text-center py-8">
        <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No reviews yet</p>
        <p className="text-gray-400">Your product reviews will appear here</p>
      </div>
    </div>
  );
}
