"use client";

import DynamicBreadcrumb from "@/lib/breadcrumb";
import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-20">
      <DynamicBreadcrumb />
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        Privacy <span className="text-[#FEBE10]">Policy</span>
      </h1>

      <p className="text-gray-700 mb-4 leading-relaxed">
        At <strong>Manual-Fits</strong>, your privacy is our priority. We are committed to protecting the personal information you share with us while providing a safe and enjoyable shopping experience.
      </p>

      <p className="text-gray-700 mb-4 leading-relaxed">
        We collect information such as your name, email, address, and order details to process your purchases and provide personalized services. This information is never sold to third parties.
      </p>

      <p className="text-gray-700 mb-4 leading-relaxed">
        Our website may use cookies to enhance your experience and remember your preferences. You can always manage or disable cookies through your browser settings.
      </p>

      <p className="text-gray-700 mb-4 leading-relaxed">
        By using <strong>Manual-Fits</strong>, you agree to the collection and use of information as described in this Privacy Policy. We ensure your data is stored securely and used only for the purposes intended.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-3">Contact Us</h2>
      <p className="text-gray-700">
        If you have any questions about our privacy practices, please contact us at <strong>support@manual-fits.com</strong>.
      </p>
    </div>
  );
}
