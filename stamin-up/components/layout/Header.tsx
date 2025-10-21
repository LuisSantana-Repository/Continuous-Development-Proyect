"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import LoginModal from "@/components/modals/LoginModal";
import RegisterModal from "@/components/modals/RegisterModal";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/services" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex h-20 items-center justify-between">
            {/* Left Side: Logo + Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]">
                  <span className="text-xl font-bold text-white">S</span>
                </div>
                <span className="heading-md text-primary">Stamin-Up</span>
              </Link>

              {/* Desktop Menu */}
              <nav className="hidden items-center space-x-6 md:flex">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative body-base font-medium transition-colors pb-1 ${
                      isActive(item.href)
                        ? "text-primary"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {item.label}
                    {isActive(item.href) && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)]" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Side: Auth Buttons */}
            <div className="hidden items-center space-x-4 md:flex">
              <Button
                variant="ghost"
                onClick={() => setShowLoginModal(true)}
                className="text-primary hover:bg-[var(--color-primary)]/5"
              >
                Iniciar sesión
              </Button>
              <Button
                onClick={() => setShowRegisterModal(true)}
                className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
              >
                Regístrate
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-primary" />
              ) : (
                <Menu className="h-6 w-6 text-primary" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-200 py-4 md:hidden">
              <nav className="flex flex-col space-y-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`body-base font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary"
                        : "text-secondary hover:text-primary"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowLoginModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-primary hover:bg-[var(--color-primary)]/5"
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRegisterModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                  >
                    Regístrate
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterModal
        open={showRegisterModal}
        onOpenChange={setShowRegisterModal}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );
}
