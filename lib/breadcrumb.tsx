"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DynamicBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const DynamicBreadcrumb: React.FC<DynamicBreadcrumbProps> = ({
  items = [],
  className = "",
}) => {
  return (
    <nav
      className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <Link
        href="/"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default DynamicBreadcrumb;
