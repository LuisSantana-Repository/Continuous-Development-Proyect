"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditProfileModal from "@/components/modals/EditProfileModal";
import type { ClientUser } from "@/types";

interface ProfileHeroProps {
  user: ClientUser;
  onUpdateUser?: (updatedUser: Partial<ClientUser>) => void;
}

export default function ProfileHero({ user, onUpdateUser }: ProfileHeroProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const memberSinceDate = new Date(user.memberSince).toLocaleDateString(
    "es-MX",
    {
      year: "numeric",
      month: "long",
    }
  );

  const handleSaveProfile = async (updatedUser: Partial<ClientUser>) => {
    // Simular guardado (en producción, aquí iría la llamada a la API)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Llamar al callback para actualizar el usuario en el componente padre
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
  };

  return (
    <section className="bg-[var(--color-background-secondary)] py-12 md:py-16">
      <div className="app-container">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-lg md:p-12">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[var(--color-primary)] shadow-md bg-[var(--color-primary)]">
                {user.profileImage && !imageError ? (
                  <Image
                    src={user.profileImage}
                    alt={user.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <span className="text-5xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="heading-lg text-primary mb-2">{user.name}</h1>
              <p className="body-base text-secondary mb-4">
                Cliente de Stamin-Up
              </p>
              <div className="flex items-center justify-center gap-2 text-muted md:justify-start">
                <Calendar className="h-4 w-4" />
                <span className="body-sm">Miembro desde {memberSinceDate}</span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Editar perfil
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      <EditProfileModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={user}
        onSave={handleSaveProfile}
      />
    </section>
  );
}
