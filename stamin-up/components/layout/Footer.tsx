import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  const footerLinks = {
    company: [
      { label: "Inicio", href: "/" },
      { label: "Servicios", href: "/services" },
    ],
    legal: [
      { label: "Términos de uso", href: "/terms" },
      { label: "Privacidad", href: "/privacy" },
      { label: "Soporte", href: "/support" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-[var(--color-primary)] text-white">
      <div className="container mx-auto px-6 py-12 md:px-12 lg:px-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <span className="heading-md text-primary">S</span>
              </div>
              <span className="heading-md">Stamin-Up</span>
            </div>
            <p className="body-sm text-white/80">
              Conectamos clientes con los mejores profesionales de servicios
              locales.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 body-sm font-semibold uppercase tracking-wider">
              Compañía
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="body-sm text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-4 body-sm font-semibold uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="body-sm text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 body-sm font-semibold uppercase tracking-wider">
              Síguenos
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 transition-colors hover:text-white"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="body-sm text-white/60">
            © 2025 Stamin-Up. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
