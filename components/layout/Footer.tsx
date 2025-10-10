import React from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Phone,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 z-1000 bottom-0 text-gray-300 pt-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company Info */}
        <div>
          <Link href="/">
            <h2 className="text-2xl font-bold text-white mb-3">ManualFits</h2>
          </Link>
          <p className="text-gray-400 text-sm mb-3">
            Your one-stop destination for premium clothing and accessories. We
            bring you the latest trends with unbeatable prices.
          </p>

          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-5 h-5 text-gray-400" />
            <a href="tel:+919999999999" className="hover:text-white">
              +91 99999 99999
            </a>
          </div>
          <div className="flex items-center space-x-3 text-sm mt-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <a href="mailto:support@myshop.com" className="hover:text-white">
              support@myshop.com
            </a>
          </div>
          <div className="flex items-center space-x-3 text-sm mt-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400">Mon - Sat: 10:00 AM - 7:00 PM</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-white">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/terms&conditions#contact-information"
                className="hover:text-white"
              >
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Address Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Our Addresses
          </h3>

          <div className="text-sm text-gray-400 mb-4">
            <p className="font-semibold text-white">Head Office</p>
            <p>123 Fashion Street, Bandra West, Mumbai - 400050</p>
            <Link
              href="https://maps.google.com?q=123+Fashion+Street+Mumbai"
              className="text-sm hover:text-white inline-flex items-center mt-1"
              target="_blank"
            >
              <MapPin className="w-4 h-4 mr-2" /> View on map
            </Link>
          </div>

          <div className="text-sm text-gray-400">
            <p className="font-semibold text-white">Warehouse</p>
            <p>456 Clothing Hub, Industrial Area, Delhi - 110045</p>
            <Link
              href="https://maps.google.com?q=456+Clothing+Hub+Delhi"
              className="text-sm hover:text-white inline-flex items-center mt-1"
              target="_blank"
            >
              <MapPin className="w-4 h-4 mr-2" /> View on map
            </Link>
          </div>
        </div>

        {/* Social & Support */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Support & Social
          </h3>

          <div className="mb-4 text-sm text-gray-400">
            <p className="font-semibold text-white">Customer Support</p>
            <p>
              For order issues, returns, or product queries, call or email us.
            </p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <a
              href="tel:+919999999999"
              aria-label="Call support"
              className="inline-flex items-center px-3 py-2 bg-gray-800 rounded hover:bg-gray-700"
            >
              <Phone className="w-4 h-4 mr-2" /> Call Us
            </a>
            <a
              href="mailto:support@myshop.com"
              aria-label="Email support"
              className="inline-flex items-center px-3 py-2 bg-gray-800 rounded hover:bg-gray-700"
            >
              <Mail className="w-4 h-4 mr-2" /> Email
            </a>
          </div>

          <div className="flex space-x-4">
            <Link
              href="https://www.facebook.com/profile.php?id=61581454930521"
              aria-label="Facebook"
              className="hover:text-blue-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook />
            </Link>
            <Link
              href="https://www.instagram.com/manualfits?igsh=YzljYTk1ODg3Zg=="
              aria-label="Instagram"
              className="hover:text-pink-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram />
            </Link>
            <Link
              href="#"
              aria-label="Twitter"
              className="hover:text-sky-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter />
            </Link>
            <Link
              href="#"
              aria-label="LinkedIn"
              className="hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Reserved Rights */}
      <div className="border-t border-gray-700 mt-8 py-4 text-center text-sm text-gray-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <span>
            © {new Date().getFullYear()} ManualFits. All Rights Reserved.
          </span>
          <span>
            Registered Office: 123 Fashion Street, Mumbai • GSTIN:
            27ABCDE1234F1Z5
          </span>
        </div>
      </div>
    </footer>
  );
}
