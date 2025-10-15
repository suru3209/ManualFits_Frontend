"use client";
import React, { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/api";

export default function TestApiPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        const res = await fetch(buildApiUrl("/api/products"), {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        console.error("Error testing API:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          API Test Results
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Response Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Success:</span>{" "}
              {data?.success ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <span className="font-medium">Total Products:</span>{" "}
              {data?.data?.length || 0}
            </div>
            <div>
              <span className="font-medium">Message:</span>{" "}
              {data?.message || "N/A"}
            </div>
            <div>
              <span className="font-medium">API URL:</span>{" "}
              {buildApiUrl("/api/products")}
            </div>
          </div>
        </div>

        {data?.data && data.data.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">First Product Sample</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {data.data[0].title}
              </div>
              <div>
                <span className="font-medium">Category:</span>{" "}
                {data.data[0].category}
              </div>
              <div>
                <span className="font-medium">Brand:</span> {data.data[0].brand}
              </div>
              <div>
                <span className="font-medium">Sizes:</span>{" "}
                {data.data[0].sizes?.length || 0}
              </div>
              <div>
                <span className="font-medium">First Size Variants:</span>{" "}
                {data.data[0].sizes?.[0]?.variants?.length || 0}
              </div>
              <div>
                <span className="font-medium">First Image:</span>
                <img
                  src={data.data[0].sizes?.[0]?.variants?.[0]?.images?.[0]}
                  alt="Product"
                  className="w-16 h-16 object-cover rounded mt-2"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <a
            href="/products"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Products Page
          </a>
        </div>
      </div>
    </div>
  );
}
