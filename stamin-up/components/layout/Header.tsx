"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Loader2 } from "lucide-react";
import LoginModal from "@/components/modals/LoginModal";
import RegisterModal from "@/components/modals/RegisterModal";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const pathname = usePathname();

  // Hook de autenticación
  const { user, isAuthenticated, logout, loading } = useAuth();

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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
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

            {/* Right Side: Auth Buttons o User Menu */}
            <div className="hidden items-center space-x-4 md:flex">
              {loading ? (
                // Estado de carga
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : isAuthenticated && user ? (
                // Usuario autenticado - mostrar botón de perfil y logout
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      (window.location.href = user.provider
                        ? "/provider"
                        : "/profile")
                    }
                    className="text-primary hover:bg-[var(--color-primary)]/5 cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    {user.provider ? "Panel Proveedor" : "Mi Perfil"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Salir
                  </Button>
                </div>
              ) : (
                // No autenticado - mostrar botones de login/registro
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setShowLoginModal(true)}
                    className="text-primary hover:bg-[var(--color-primary)]/5 cursor-pointer"
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    onClick={() => setShowRegisterModal(true)}
                    className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] cursor-pointer"
                  >
                    Regístrate
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden cursor-pointer"
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

                {/* Mobile Auth Section */}
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : isAuthenticated && user ? (
                    // Usuario autenticado en móvil
                    <>
                      <div className="px-2 py-2 text-sm">
                        <p className="font-medium text-primary">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        {user.provider && (
                          <span className="text-xs text-[var(--color-primary)] font-medium">
                            Proveedor
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          window.location.href = user.provider
                            ? "/provider"
                            : "/profile";
                        }}
                        className="w-full justify-start text-primary cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        {user.provider ? "Panel Proveedor" : "Mi Perfil"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-red-600 cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                      </Button>
                    </>
                  ) : (
                    // No autenticado en móvil
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowLoginModal(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-primary hover:bg-[var(--color-primary)]/5 cursor-pointer"
                      >
                        Iniciar sesión
                      </Button>
                      <Button
                        onClick={() => {
                          setShowRegisterModal(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] cursor-pointer"
                      >
                        Regístrate
                      </Button>
                    </>
                  )}
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
