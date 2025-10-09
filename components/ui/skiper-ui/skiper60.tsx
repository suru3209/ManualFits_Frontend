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
          By accessing and using our website, you agree to be bound by these
          terms and conditions. If you do not agree with these terms, please do
          not use our website.
        </p>
        <p className="lg:text-lg">
          These terms constitute a binding agreement between you and Skiper ui.
          Your continued use of our services indicates your acceptance of any
          updates or modifications to these terms.
        </p>
      </>
    ),
  },
  {
    id: "license-agreement",
    title: "License Agreement",
    content: (
      <>
        <p className="lg:text-lg">
          Skiper ui is licensed, not sold. Upon purchase, you are granted a
          non-exclusive, non-transferable, and revocable license to use the
          Skiper ui plugin for personal or professional music production
          purposes. This license allows you to install the plugin on up to two
          devices that you own, unless additional installations are explicitly
          permitted.
        </p>
        <ul className="list-disc space-y-2 pl-4 lg:text-lg">
          <li>You may not share, resell, rent, or sublicense the plugin.</li>
          <li>
            Reverse engineering, decompiling, disassembling, or attempting to
            discover the source code of Skiper ui is strictly prohibited.
          </li>
          <li>
            You may not modify the plugin or use it to create derivative works.
          </li>
          <li>
            Skiper ui must not be used for any illegal, defamatory, or
            unauthorized purposes.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "ownership",
    title: "Ownership",
    content: (
      <>
        <p className="lg:text-lg">
          Skiper ui retains all rights, title, and interest in and to the Skiper
          ui plugin, including all intellectual property rights. This license
          does not grant you any ownership rights to the plugin.
        </p>
        <p className="lg:text-lg">
          All trademarks, service marks, and trade names used in connection with
          the plugin are the property of Skiper ui or their respective owners.
        </p>
      </>
    ),
  },
  {
    id: "updates-and-support",
    title: "Updates and Support",
    content: (
      <>
        <p className="lg:text-lg">
          We may provide updates, bug fixes, and new features for Skiper ui at
          our discretion. These updates may be provided automatically or may
          require manual installation.
        </p>
        <p className="lg:text-lg">
          Technical support is provided on a best-effort basis through our
          official support channels. We do not guarantee response times or
          resolution of issues.
        </p>
      </>
    ),
  },
  {
    id: "refund-policy",
    title: "Refund Policy",
    content: (
      <>
        <p className="lg:text-lg">
          All sales are final. We do not offer refunds for digital products
          unless required by applicable law. If you experience technical issues,
          please contact our support team first.
        </p>
        <p className="lg:text-lg">
          In exceptional circumstances, refunds may be considered on a
          case-by-case basis within 14 days of purchase, provided that the
          product has not been used extensively.
        </p>
      </>
    ),
  },
  {
    id: "system-requirements",
    title: "System Requirements",
    content: (
      <>
        <p className="lg:text-lg">
          Skiper ui requires a compatible DAW (Digital Audio Workstation) and
          operating system. Please check our website for current system
          requirements before purchasing.
        </p>
        <ul className="list-disc space-y-2 pl-4 lg:text-lg">
          <li>Windows 10 or later (64-bit)</li>
          <li>macOS 10.15 or later (Intel/Apple Silicon)</li>
          <li>VST3, AU, or AAX compatible DAW</li>
          <li>Minimum 4GB RAM (8GB recommended)</li>
        </ul>
      </>
    ),
  },
  {
    id: "disclaimer-of-warranties",
    title: "Disclaimer of Warranties",
    content: (
      <>
        <p className="lg:text-lg">
          Skiper ui is provided &quot;as is&quot; without any warranties,
          express or implied. We do not warrant that the plugin will be
          error-free or that it will meet your specific requirements.
        </p>
        <p className="lg:text-lg">
          You use the plugin at your own risk. We disclaim all warranties of
          merchantability, fitness for a particular purpose, and
          non-infringement.
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
          In no event shall Skiper ui be liable for any indirect, incidental,
          special, consequential, or punitive damages arising out of or relating
          to your use of Skiper ui.
        </p>
        <p className="lg:text-lg">
          Our total liability to you for any damages shall not exceed the amount
          you paid for the plugin license.
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
          If you have any questions about these terms and conditions, please
          contact us at:
        </p>
        <div className="space-y-2 lg:text-lg">
          <p>Email: support@skiperui.com</p>
          <p>Website: www.skiperui.com</p>
          <p>Address: 123 Music Lane, Audio City, AC 12345</p>
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
      <div className="-ml-6">
        <DynamicBreadcrumb />
      </div>
      <h1 className="font-cal-sans pt-[40px] text-3xl md:text-5xl lg:pt-0">
        {title}
      </h1>
      <div className="relative mb-[50vh] flex gap-12 py-[40px] md:py-[80px]">
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
