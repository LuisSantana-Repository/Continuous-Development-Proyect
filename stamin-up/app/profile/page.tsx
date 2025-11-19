"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Section from "@/components/layout/Section";
import ProfileHero from "@/components/profile/ProfileHero";
import EditProfileModal from "@/components/modals/EditProfileModal";
import PersonalInfoCard from "@/components/profile/PersonalInfoCard";
import OrdersList from "@/components/profile/OrdersList";
import ClientReviewsList from "@/components/profile/ClientReviewsList";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import { useClientUser } from "@/hooks/useClientUser";
import { useOrders } from "@/hooks/useOrders";
import { useClientReviews } from "@/hooks/useClientReviews";
import { useAuth } from "@/hooks/useAuth";
import type { ClientUser } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    isLoading: userLoading,
    error: userError,
    updateProfile,
  } = useClientUser();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { reviews, isLoading: reviewsLoading } = useClientReviews();
  const { logout } = useAuth();

  // Estado local para el usuario (permite actualizaciones optimistas)
  const [localUser, setLocalUser] = useState<ClientUser | null>(user);
  const [editProfileModal, setEditProfileModal] = useState(false);

  // Actualizar localUser cuando user cambie (primera carga)
  if (user && !localUser) {
    setLocalUser(user);
  }

  const handleUpdateUser = () => {
    // Abrir el modal de edición de cliente
    setEditProfileModal(true);
  };

  const handleSaveProfile = async (updates: {
    username?: string;
    email?: string;
    address?: string;
    Foto?: string;
  }) => {
    try {
      const updatedUser = await updateProfile(updates);
      // Actualizar el estado local con el usuario actualizado del backend
      setLocalUser(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      await logout();
    }
  };

  // Mostrar skeleton mientras carga
  if (userLoading) {
    return <ProfileSkeleton />;
  }

  // Mostrar error si falla la carga del usuario
  if (userError || !localUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="heading-lg text-primary mb-4">
            Error al cargar el perfil
          </h2>
          <p className="body-base text-secondary mb-6">
            {userError || "No se pudo cargar la información del usuario"}
          </p>
          <Button onClick={() => router.push("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <ProfileHero user={localUser} onUpdateUser={handleUpdateUser} />

      {/* Main Content */}
      <Section size="md">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {/* Main Content - Orders & Reviews */}
          <div className="space-y-12 lg:col-span-2">
            {/* Service History Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="heading-md text-primary">
                    Historial de Servicios
                  </h2>
                  <p className="body-sm text-secondary">
                    Revisa tus servicios solicitados
                  </p>
                </div>
              </div>

              <OrdersList orders={orders} isLoading={ordersLoading} />
            </div>

            {/* Reviews Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="heading-md text-primary">Mis Reseñas</h2>
                  <p className="body-sm text-secondary">
                    Reseñas que has dejado a proveedores
                  </p>
                </div>
              </div>

              <ClientReviewsList reviews={reviews} isLoading={reviewsLoading} />
            </div>
          </div>

          {/* Sidebar - Personal Info */}
          <div className="space-y-6">
            <PersonalInfoCard user={localUser} />

            {/* Logout Button */}
            <Button
              variant="outline"
              className="w-full gap-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </Section>

      {/* Modal de edición de perfil de cliente */}
      {localUser && (
        <EditProfileModal
          open={editProfileModal}
          onOpenChange={setEditProfileModal}
          user={localUser}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
