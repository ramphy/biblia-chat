"use client"; // This is now a Client Component

import Image from "next/image";
import { motion } from "motion/react";
// Removed TFunction import

// Define props to accept the translated strings
interface HeroSectionOneProps {
  heroTitle: string;
  heroSubtitle: string;
}

// Component receives translated strings via props
export default function HeroSectionOne({ heroTitle, heroSubtitle }: HeroSectionOneProps) {
  return (
    <div className="relative mx-auto my-10 flex max-w-7xl flex-col items-center justify-center">
      {/* Navbar removed */}
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20 text-center"> {/* Added text-center */}
        {/* Replaced h1 content with Biblia.chat title */}
        <h1 className="relative z-10 mx-auto max-w-4xl text-4xl font-bold tracking-tight text-slate-700 sm:text-6xl dark:text-slate-300">
          {heroTitle // Using heroTitle prop
            .split(" ")
            .map((word: string, index: number) => ( // Added types for map parameters
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block" // Adjusted margin if needed
              >
                {word}
              </motion.span>
            ))}
        </h1>
        {/* Replaced paragraph content with Biblia.chat description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="relative z-10 mx-auto max-w-xl py-4 text-lg leading-8 text-neutral-600 dark:text-neutral-400" // Adjusted classes if needed
        >
          {heroSubtitle} {/* Using heroSubtitle prop */}
        </motion.p>
        {/* Replaced buttons with App Store/Google Play links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1 }}
          className="relative z-10 mt-6 flex items-center justify-center gap-x-6" // Adjusted classes if needed
        >
          <a
            href="https://play.google.com/store/apps/details?id=redmasiva.bibliachat"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/google-play-button.png"
              alt="Get it on Google Play"
              width={180} // Adjust width as needed
              height={54} // Adjust height as needed
              priority
            />
          </a>
          <a
            href="https://apps.apple.com/app/apple-store/id6447997746"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/app-store-button.svg"
              alt="Download on the App Store"
              width={160} // Adjust width as needed
              height={54} // Adjust height as needed
              priority
            />
          </a>
        </motion.div>
        {/* Removed the placeholder image section */}
      </div>
    </div>
  );
}
