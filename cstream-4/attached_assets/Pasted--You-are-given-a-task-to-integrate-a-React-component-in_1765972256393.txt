
You are given a task to integrate a React component into your codebase.
Please verify your project has the following setup:
- shadcn/ui project structure
- Tailwind CSS v4.0
- TypeScript

If any of these are missing, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
File location: components/tooltip-card-demo.tsx

File content: "use client";
import { Tooltip } from "@/components/ui/tooltip-card";
import React from "react";

export default function TooltipCardDemo() {
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-10">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        There was a problem with the server. Once{" "}
        <Tooltip
          containerClassName="text-neutral-600 dark:text-neutral-400"
          content="AWS markets itself as the “world's most comprehensive and broadly adopted cloud platform” offering over 200 fully featured services globally."
        >
          <span className="font-bold">AWS</span>
        </Tooltip>{" "}
        went down, we had to quickly migrate to a new provider. AWS in general
        is a great service, but sometimes it&apos;s not available.
      </p>
      <p className="mt-10 text-sm text-neutral-600 dark:text-neutral-400">
        The server was administered by{" "}
        <Tooltip
          containerClassName="text-neutral-600 dark:text-neutral-400"
          content={<TooltipCard />}
        >
          {" "}
          <span className="cursor-pointer font-bold">Tyler Durden.</span>
        </Tooltip>{" "}
        Tyler has been with us for a long time. He is a great asset to the team
        and sometimes tries to act in different ways which can be difficult to
        manage.{" "}
      </p>

      <p className="mt-10 text-sm text-neutral-600 dark:text-neutral-400">
        That is when we approached Tyler for a cute little{" "}
        <Tooltip
          containerClassName="text-neutral-600 dark:text-neutral-400"
          content={<TestimonialCard />}
        >
          {" "}
          <span className="cursor-pointer font-bold">testimonial.</span>
        </Tooltip>{" "}
        Instead of a testimonial, he started yapping about project mayhem and
        how we should be using our skills to build a better future.
      </p>
    </div>
  );
}

const TooltipCard = () => {
  return (
    <div>
      <img
        src="https://assets.aceternity.com/screenshots/tyler.webp"
        alt="Tyler Durden"
        className="aspect-square w-full rounded-sm"
      />
      <div className="my-4 flex flex-col">
        <p className="text-lg font-bold">Tyler Durden</p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Soap Developer from a Tier 3 college. Enthusiastic and exhibits
          entrepreneurial spirit.
        </p>
      </div>
    </div>
  );
};

const TestimonialCard = () => {
  return (
    <div className="">
      <blockquote className="mb-4 text-neutral-700 dark:text-neutral-300">
        This product is absolutely, grade A horse shit.
      </blockquote>
      <div className="flex items-center gap-2">
        <img
          src="https://assets.aceternity.com/screenshots/tyler.webp"
          alt="Tyler Durden"
          className="size-6 rounded-full object-cover"
        />
        <div>
          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            Tyler Durden
          </p>
          <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
            Senior Product Manager at FC
          </p>
        </div>
      </div>
    </div>
  );
};


File location: components/ui/tooltip-card.tsx

File content: "use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export const Tooltip = ({
  content,
  children,
  containerClassName,
}: {
  content: string | React.ReactNode;
  children: React.ReactNode;
  containerClassName?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [height, setHeight] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isVisible, content]);

  const calculatePosition = (mouseX: number, mouseY: number) => {
    if (!contentRef.current || !containerRef.current)
      return { x: mouseX + 12, y: mouseY + 12 };

    const tooltip = contentRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get tooltip dimensions
    const tooltipWidth = 240; // min-w-[15rem] = 240px
    const tooltipHeight = tooltip.scrollHeight;

    // Calculate absolute position relative to viewport
    const absoluteX = containerRect.left + mouseX;
    const absoluteY = containerRect.top + mouseY;

    let finalX = mouseX + 12;
    let finalY = mouseY + 12;

    // Check if tooltip goes beyond right edge
    if (absoluteX + 12 + tooltipWidth > viewportWidth) {
      finalX = mouseX - tooltipWidth - 12;
    }

    // Check if tooltip goes beyond left edge
    if (absoluteX + finalX < 0) {
      finalX = -containerRect.left + 12;
    }

    // Check if tooltip goes beyond bottom edge
    if (absoluteY + 12 + tooltipHeight > viewportHeight) {
      finalY = mouseY - tooltipHeight - 12;
    }

    // Check if tooltip goes beyond top edge
    if (absoluteY + finalY < 0) {
      finalY = -containerRect.top + 12;
    }

    return { x: finalX, y: finalY };
  };

  const updateMousePosition = (mouseX: number, mouseY: number) => {
    setMouse({ x: mouseX, y: mouseY });
    const newPosition = calculatePosition(mouseX, mouseY);
    setPosition(newPosition);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsVisible(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    updateMousePosition(mouseX, mouseY);
  };

  const handleMouseLeave = () => {
    setMouse({ x: 0, y: 0 });
    setPosition({ x: 0, y: 0 });
    setIsVisible(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isVisible) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    updateMousePosition(mouseX, mouseY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    updateMousePosition(mouseX, mouseY);
    setIsVisible(true);
  };

  const handleTouchEnd = () => {
    // Delay hiding to allow for tap interaction
    setTimeout(() => {
      setIsVisible(false);
      setMouse({ x: 0, y: 0 });
      setPosition({ x: 0, y: 0 });
    }, 2000);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Toggle visibility on click for mobile devices
    if (window.matchMedia("(hover: none)").matches) {
      e.preventDefault();
      if (isVisible) {
        setIsVisible(false);
        setMouse({ x: 0, y: 0 });
        setPosition({ x: 0, y: 0 });
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        updateMousePosition(mouseX, mouseY);
        setIsVisible(true);
      }
    }
  };

  // Update position when tooltip becomes visible or content changes
  useEffect(() => {
    if (isVisible && contentRef.current) {
      const newPosition = calculatePosition(mouse.x, mouse.y);
      setPosition(newPosition);
    }
  }, [isVisible, height, mouse.x, mouse.y]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", containerClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key={String(isVisible)}
            initial={{ height: 0, opacity: 1 }}
            animate={{ height, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="pointer-events-none absolute z-50 min-w-[15rem] overflow-hidden rounded-md border border-transparent bg-white shadow-sm ring-1 shadow-black/5 ring-black/5 dark:bg-neutral-900 dark:shadow-white/10 dark:ring-white/5"
            style={{
              top: position.y,
              left: position.x,
            }}
          >
            <div
              ref={contentRef}
              className="p-2 text-sm text-neutral-600 md:p-4 dark:text-neutral-400"
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


