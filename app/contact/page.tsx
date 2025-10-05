"use client";

import React, { useState } from "react";
import DynamicBreadcrumb from "@/lib/breadcrumb";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Message sent successfully!\n\n${JSON.stringify(formData, null, 2)}`);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-20">
      <DynamicBreadcrumb />
      <h1 className="text-4xl font-bold mb-6 text-gray-800">
        Contact <span className="text-[#FEBE10]">Us</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Contact Info */}
        <div className="lg:w-1/2 bg-gray-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          <p className="text-gray-700 mb-2">
            📍 Address: 123, MG Road, Delhi, India
          </p>
          <p className="text-gray-700 mb-2">📞 Phone: +91 98765 43210</p>
          <p className="text-gray-700 mb-2">
            ✉️ Email: support@manual-fits.com
          </p>
          <p className="text-gray-700 mt-4">
            We are here to answer any questions you may have. Reach out to us
            and we’ll respond as soon as possible!
          </p>
        </div>

        {/* Contact Form */}
        <div className="lg:w-1/2 bg-gray-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="w-full p-3 border rounded"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full p-3 border rounded"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <textarea
              name="message"
              placeholder="Your Message"
              className="w-full p-3 border rounded h-32 resize-none"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button
              type="submit"
              className="w-full bg-[#FEBE10] hover:bg-yellow-600 text-gray-800 py-3 rounded-lg font-semibold transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
