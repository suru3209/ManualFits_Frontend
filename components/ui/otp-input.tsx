"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface OTPInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  length?: number;
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
  containerClassName?: string;
}

const OTPInput = React.forwardRef<HTMLInputElement, OTPInputProps>(
  (
    {
      length = 6,
      onChange,
      value = "",
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const [otp, setOtp] = React.useState(value.split(""));
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
      if (value) {
        setOtp(value.split(""));
      }
    }, [value]);

    React.useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleChange = (
      element: HTMLInputElement,
      index: number,
      val: string
    ) => {
      if (isNaN(Number(val))) return;

      const newOtp = [...otp];
      newOtp[index] = val;
      setOtp(newOtp);

      // Call onChange with the complete OTP string
      onChange?.(newOtp.join(""));

      // Focus next input
      if (val && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>,
      index: number
    ) => {
      if (e.key === "Backspace") {
        if (!otp[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        } else {
          const newOtp = [...otp];
          newOtp[index] = "";
          setOtp(newOtp);
          onChange?.(newOtp.join(""));
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");
      const pastedNumbers = pastedData.replace(/\D/g, "").slice(0, length);

      const newOtp = Array.from({ length }, (_, i) => pastedNumbers[i] || "");
      setOtp(newOtp);
      onChange?.(newOtp.join(""));

      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedNumbers.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    };

    return (
      <div className={cn("flex gap-2", containerClassName)}>
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[index] || ""}
            onChange={(e) => handleChange(e.target, index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            className={cn(
              "w-12 h-12 text-center border border-gray-300 rounded-lg",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
              "transition-colors duration-200",
              "text-lg font-semibold",
              "disabled:bg-gray-100 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
        ))}
      </div>
    );
  }
);

OTPInput.displayName = "OTPInput";

export { OTPInput };
