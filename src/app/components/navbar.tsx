"use client";
import React, { useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  // NavbarLogo, // We'll use our custom logo
  // NavbarButton // We might use Button from ui/button instead
} from "@/components/ui/resizable-navbar"; // Import the new components

// Define navigation items based on your old navbar
const navItems = [
  { name: "Home", link: "/" },
  { name: "Read Bible", link: "/es/bible" }, // Assuming default language 'es' for now
  { name: "Login/Register", link: "/es/auth" }, // Assuming default language 'es' for now
];

export default function NavbarComponent() { // Renamed to avoid conflict with imported Navbar
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = () => {
    setIsOpen(false); // Close mobile menu on item click
  };

  const CustomLogo = () => (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg relative z-20 mr-4 px-2 py-1 text-black dark:text-white">
      <Image src="/logo.png" alt="Biblia.chat Logo" width={32} height={32} />
      <span className="font-medium">Biblia.chat</span>
    </Link>
  );

  const SearchBar = () => (
    <div className="search flex items-center gap-2 relative z-20 ml-4">
      <Input type="search" placeholder="Search..." className="w-auto bg-white dark:bg-neutral-800" />
      <Button variant="outline">Search</Button>
    </div>
  );

  return (
    <Navbar className="top-0"> {/* Adjust top positioning if needed */}
      {/* Desktop Navbar */}
      <NavBody className="justify-between">
        <CustomLogo />
        <NavItems items={navItems} onItemClick={handleItemClick} />
        <SearchBar />
      </NavBody>

      {/* Mobile Navbar */}
      <MobileNav className="justify-between">
        <MobileNavHeader>
          <CustomLogo />
          <MobileNavToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {/* Mobile Menu Items */}
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={handleItemClick}
              className="block px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded"
            >
              {item.name}
            </Link>
          ))}
          {/* Mobile Search Bar */}
          <div className="px-4 pt-4">
             <SearchBar />
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
