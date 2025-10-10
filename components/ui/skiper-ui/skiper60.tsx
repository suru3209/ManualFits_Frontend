"use client";

import { motion, useInView } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import DynamicBreadcrumb from "@/lib/breadcrumb";
import { cn } from "@/lib/utils";

type TermItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type Skiper60Props = {
  title?: string;
  terms?: TermItem[];
  className?: string;
};

const TermSection = ({
  term,
  index,
  children,
  setActiveTerm,
}: {
  term: TermItem;
  index: number;
  children: React.ReactNode;
  setActiveTerm: (index: number) => void;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 0.3,
    margin: "-100px 0px -50% 0px",
  });

  useEffect(() => {
    if (isInView) {
      setActiveTerm(index);
    }
  }, [isInView, index, setActiveTerm]);

  return (
    <div ref={ref} id={term.id} className="space-y-4 md:space-y-6">
      {children}
    </div>
  );
};

const defaultTerms: TermItem[] = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of Terms",
    content: (
      <>
        <p className="lg:text-lg">
          By accessing and using ManualFits, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use our website or services.
        </p>
        <p className="lg:text-lg">
          These terms form a legal agreement between you and ManualFits. We may update these terms from time to time, and your continued use of our platform means you accept the updated version.
        </p>
      </>
    ),
  },
  {
    id: "license-agreement",
    title: "Use of Our Services",
    content: (
      <>
        <p className="lg:text-lg">
          ManualFits grants you a limited, non-exclusive, and revocable right to browse and shop through our platform for personal and non-commercial purposes only.
        </p>
        <ul className="list-disc space-y-2 pl-4 lg:text-lg">
          <li>You may not copy, distribute, or modify any part of our website or content without permission.</li>
          <li>Any attempt to disrupt or interfere with the website’s security, operations, or transactions is strictly prohibited.</li>
          <li>You agree to use accurate personal information while creating or managing your account.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ownership",
    title: "Intellectual Property",
    content: (
      <>
        <p className="lg:text-lg">
          All website content including images, text, designs, logos, and product descriptions are owned or licensed by ManualFits. These materials are protected under applicable copyright and trademark laws.
        </p>
        <p className="lg:text-lg">
          You may not reproduce or use our intellectual property without written permission from ManualFits.
        </p>
      </>
    ),
  },
  {
    id: "orders-and-payments",
    title: "Orders and Payments",
    content: (
      <>
        <p className="lg:text-lg">
          All product prices are displayed in INR (₹) and include applicable taxes. Orders will be processed only after successful payment confirmation.
        </p>
        <ul className="list-disc space-y-2 pl-4 lg:text-lg">
          <li>ManualFits reserves the right to cancel any order if fraud or unauthorized activity is suspected.</li>
          <li>Payment failures or gateway errors are not the responsibility of ManualFits.</li>
        </ul>
      </>
    ),
  },
  {
    id: "refund-policy",
    title: "Return & Refund Policy",
    content: (
      <>
        <p className="lg:text-lg">
          We aim to provide the best shopping experience. If you are not satisfied with a product, you may request a return or replacement within 7 days of delivery, subject to our return conditions.
        </p>
        <p className="lg:text-lg">
          Refunds will be processed to the original payment method within 5–10 business days after product inspection. Please ensure items are unused and in original packaging.
        </p>
      </>
    ),
  },
  {
    id: "shipping",
    title: "Shipping and Delivery",
    content: (
      <>
        <p className="lg:text-lg">
          We partner with reliable delivery providers to ensure safe and timely shipment. Standard delivery time is 5–7 business days, depending on your location.
        </p>
        <p className="lg:text-lg">
          Tracking information will be provided once your order has been shipped. Delays due to unforeseen logistics or weather issues are not the responsibility of ManualFits.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy and Data Protection",
    content: (
      <>
        <p className="lg:text-lg">
          Your privacy is important to us. We collect and store only necessary personal data to process your orders and improve our services. We never sell or share your data with unauthorized parties.
        </p>
        <p className="lg:text-lg">
          By using ManualFits, you consent to our data usage as outlined in our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: (
      <>
        <p className="lg:text-lg">
          ManualFits is not responsible for indirect, incidental, or consequential damages resulting from the use or inability to use our website or products.
        </p>
        <p className="lg:text-lg">
          Our total liability shall not exceed the total amount paid by you for the specific product or service in question.
        </p>
      </>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
      <>
        <p className="lg:text-lg">
          If you have any questions or concerns about these Terms & Conditions, feel free to contact us:
        </p>
        <div className="space-y-2 lg:text-lg">
          <p>Email: support@manualfits.com</p>
          <p>Website: www.manualfits.com</p>
          <p>Address: ManualFits Headquarters, New Delhi, India</p>
        </div>
      </>
    ),
  },
];

const Skiper60 = ({
  title = "Terms & Conditions",
  terms = defaultTerms,
  className,
}: Skiper60Props) => {
  const [activeTerm, setActiveTerm] = useState(0);

  return (
    <div className={cn("min-h-screen p-4 lg:p-12", className)}>
      <div className="-ml-6 lg:-mt-4">
        <DynamicBreadcrumb />
      </div>
      <h1 className="font-cal-sans lg:pt-[10px] text-3xl md:text-5xl">
        {title}
      </h1>
      <div className="relative  flex gap-1 py-[40px] md:py-[80px]">
        <ul className="border-foreground/10 sticky top-24 hidden h-fit w-full max-w-[300px] space-y-4 border-l md:block">
          {terms.map((term, index) => (
            <li className="relative cursor-pointer pl-3" key={term.id}>
              <a href={`#${term.id}`}>
                {activeTerm === index && (
                  <motion.span
                    layoutId="active-term"
                    className="bg-foreground absolute -left-[1.5px] top-1/2 inline-block h-5 w-[2px] -translate-y-1/2 rounded-2xl"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <p
                  className={cn(
                    "opacity-50 transition-opacity duration-200",
                    activeTerm === index && "opacity-100"
                  )}
                >
                  {term.title}
                </p>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-1 flex-col gap-[40px] md:gap-[60px]">
          {terms.map((term, index) => (
            <TermSection
              key={term.id}
              term={term}
              index={index}
              setActiveTerm={setActiveTerm}
            >
              <h3 className="font-cal-sans text-xl lg:text-3xl">
                {term.title}
              </h3>
              <div className="opacity-35">{term.content}</div>
            </TermSection>
          ))}
        </div>
      </div>
    </div>
  );
};

export { Skiper60 };
export type { Skiper60Props, TermItem };
