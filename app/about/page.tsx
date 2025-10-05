"use client";

import React from "react";
import DynamicBreadcrumb from "@/lib/breadcrumb";

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-20">
      <DynamicBreadcrumb />
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        About <span className="text-[#FEBE10]">Manual-Fits</span> Clothing
      </h1>

      <p className="text-gray-700 mb-4 leading-relaxed">
        Welcome to <strong>Manual-Fits</strong> – your ultimate destination for
        modern, stylish, and comfortable clothing. We are passionate about
        creating fashion that blends quality, comfort, and style effortlessly.
      </p>

      <p className="text-gray-700 mb-4 leading-relaxed">
        Since our inception, we have been committed to bringing the latest
        trends to your wardrobe. Our designs are crafted with attention to
        detail, ensuring that every piece feels unique and elevates your
        personal style.
      </p>

      <p className="text-gray-700 mb-8 leading-relaxed">
        At <strong>Manual-Fits</strong>, we believe clothing is more than just
        fabric – it’s an experience. Join our community and upgrade your style
        with the latest trends.
      </p>

      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[250px] bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
          <p className="text-gray-600">
            To deliver high-quality, stylish clothing that empowers our
            customers to feel confident and unique every day.
          </p>
        </div>
        <div className="flex-1 min-w-[250px] bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
          <p className="text-gray-600">
            To be a leading clothing brand recognized for innovation,
            sustainability, and a customer-first approach.
          </p>
        </div>
        <div className="flex-1 min-w-[250px] bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Our Values</h3>
          <p className="text-gray-600">
            Quality, Comfort, Style, and Customer Satisfaction are at the heart
            of everything we do.
          </p>
        </div>
      </div>
    </div>
  );
}
