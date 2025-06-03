"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container-professional">
        <div className="flex items-center justify-between h-16 px-4 md:px-0">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-base">BF</span>
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-foreground">Bank's Floor</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">Banking Community</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground"
            >
              Home
            </Link>
            <Link
              href="/blogs"
              className="text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              Blogs
            </Link>
            <Link
              href="/create-blog"
              className="text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground px-3 py-1.5 rounded-md transition-colors"
            >
              Publish
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Toggle menu</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-4">
                  <Link
                    href="/"
                    className="text-xs md:text-sm font-medium px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground"
                  >
                    Home
                  </Link>
                  <Link
                    href="/blogs"
                    className="text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground px-3 py-1.5 rounded-md transition-colors"
                  >
                    Insights
                  </Link>
                  <Link
                    href="/create-blog"
                    className="text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground px-3 py-1.5 rounded-md transition-colors"
                  >
                    Contribute
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="ml-2">
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                      <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {session?.user?.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600 focus:text-red-600"
                  >
                    Log out  
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground px-3">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="btn-primary-professional">
                    Join 
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 