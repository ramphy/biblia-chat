import Link from 'next/link';
import Image from 'next/image';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"; // Assuming shadcn navigation menu is installed here
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b bg-background">
      {/* Logo */}
      <div className="logo">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Image src="/logo.png" alt="Biblia.chat Logo" width={32} height={32} />
          Biblia.chat
        </Link>
      </div>

      {/* Menu Items */}
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/es/bible/JHN/1" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Read Bible
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/es/auth" passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Login/Register
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* Search Bar */}
      <div className="search flex items-center gap-2">
        <Input type="search" placeholder="Search..." className="w-auto" />
        <Button variant="outline">Search</Button>
      </div>
    </nav>
  );
}
