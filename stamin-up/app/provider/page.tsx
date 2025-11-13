"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import ProfileHero from "@/components/profile/ProfileHero";
import RequestsList from "@/components/provider/RequestsList";
import ProviderCalendar from "@/components/provider/ProviderCalendar";
import RejectRequestModal from "@/components/provider/RejectRequestModal";
import EditRequestModal from "@/components/provider/EditRequestModal";
import RequestDetailDrawer from "@/components/provider/RequestDetailDrawer";
import ReportRequestModal from "@/components/provider/ReportRequestModal";
import ChatPlaceholderDialog from "@/components/provider/ChatPlaceholderDialog";
import { useProviderUser } from "@/hooks/useProviderUser";
import { useProviderRequests } from "@/hooks/useProviderRequests";
import type { ProviderRequest, ProviderUser, ClientUser } from "@/types";

export default function ProviderPage() {
  const {
    provider,
    loading: providerLoading,
    updateProvider,
  } = useProviderUser();
  const {
    requests,
    loading: requestsLoading,
    acceptRequest,
    rejectRequest,
    updateRequest,
    startWork,
    completeWork,
  } = useProviderRequests();

  // Modals state
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    requestId: string;
    serviceName: string;
  }>({ open: false, requestId: "", serviceName: "" });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    request: ProviderRequest | null;
  }>({ open: false, request: null });

  const [detailDrawer, setDetailDrawer] = useState<{
    open: boolean;
    request: ProviderRequest | null;
  }>({ open: false, request: null });

  const [reportModal, setReportModal] = useState<{
    open: boolean;
    request: ProviderRequest | null;
  }>({ open: false, request: null });

  const [chatDialog, setChatDialog] = useState(false);

  // Handlers
  const handleAccept = async (requestId: string) => {
    await acceptRequest(requestId);
    // Mostrar alerta de éxito
    setTimeout(() => {
      alert("Solicitud aceptada exitosamente");
    }, 250);
  };

  const handleReject = (requestId: string) => {
    const request = requests.find((r) => r.requestId === requestId);
    if (request) {
      setRejectModal({
        open: true,
        requestId,
        serviceName: request.serviceName,
      });
    }
  };

  const handleRejectConfirm = async (requestId: string, reason: string) => {
    await rejectRequest(requestId, reason);
    // Mostrar alerta de éxito
    setTimeout(() => {
      alert("Solicitud rechazada");
    }, 250);
  };

  const handleEdit = (requestId: string) => {
    const request = requests.find((r) => r.requestId === requestId);
    if (request) {
      setEditModal({ open: true, request });
    }
  };

  const handleEditConfirm = async (
    requestId: string,
    updates: Partial<ProviderRequest>
  ) => {
    await updateRequest(requestId, updates);
    // Mostrar alerta de éxito
    setTimeout(() => {
      alert("Solicitud actualizada exitosamente");
    }, 250);
  };

  const handleOpenChat = () => {
    setChatDialog(true);
  };

  const handleReport = (requestId: string) => {
    const request = requests.find((r) => r.requestId === requestId);
    if (request) {
      setReportModal({ open: true, request });
    }
  };

  const handleViewDetail = (requestId: string) => {
    const request = requests.find((r) => r.requestId === requestId);
    if (request) {
      setDetailDrawer({ open: true, request });
    }
  };

  const handleStartWork = async (requestId: string) => {
    await startWork(requestId);
    setTimeout(() => {
      alert("Trabajo iniciado exitosamente");
    }, 250);
  };

  const handleCompleteWork = async (requestId: string) => {
    await completeWork(requestId);
    setTimeout(() => {
      alert("Trabajo marcado como completado");
    }, 250);
  };

  const handleUpdateUser = (updates: Partial<ClientUser>) => {
    // Convertir ClientUser a ProviderUser para compatibilidad
    updateProvider(updates as Partial<ProviderUser>);
  };

  // Convertir ProviderUser a ClientUser para ProfileHero
  const localUser: ClientUser | null = provider
    ? {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        address: provider.address,
        memberSince: provider.memberSince,
        profileImage: provider.profileImage,
      }
    : null;

  if (providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!provider || !localUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-lg text-primary mb-4">
            Error al cargar el proveedor
          </h1>
          <p className="body-base text-secondary">
            No se pudo cargar la información del proveedor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero con ProfileHero */}
      <ProfileHero user={localUser} onUpdateUser={handleUpdateUser} />

      {/* Contenido Principal */}
      <section className="app-container py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna Izquierda: Solicitudes (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="heading-lg text-primary">
                Solicitudes de Servicio
              </h2>
              <p className="body-base text-secondary">
                {requests.length} total{requests.length !== 1 ? "es" : ""}
              </p>
            </div>

            <RequestsList
              requests={requests}
              loading={requestsLoading}
              onAccept={handleAccept}
              onReject={handleReject}
              onEdit={handleEdit}
              onOpenChat={handleOpenChat}
              onReport={handleReport}
              onViewDetail={handleViewDetail}
              onStartWork={handleStartWork}
              onCompleteWork={handleCompleteWork}
            />
          </div>

          {/* Columna Derecha: Calendario (1/3) */}
          <div className="space-y-6">
            <h2 className="heading-lg text-primary">Calendario</h2>
            <ProviderCalendar providerId={Number(provider.id)} />
          </div>
        </div>
      </section>

      {/* Modals y Dialogs */}
      <RejectRequestModal
        open={rejectModal.open}
        onOpenChange={(open) => setRejectModal({ ...rejectModal, open })}
        requestId={rejectModal.requestId}
        serviceName={rejectModal.serviceName}
        onConfirm={handleRejectConfirm}
      />

      {editModal.request && (
        <EditRequestModal
          open={editModal.open}
          onOpenChange={(open) => setEditModal({ ...editModal, open })}
          request={editModal.request}
          onConfirm={handleEditConfirm}
        />
      )}

      <RequestDetailDrawer
        open={detailDrawer.open}
        onOpenChange={(open) => setDetailDrawer({ ...detailDrawer, open })}
        request={detailDrawer.request}
        onStartWork={handleStartWork}
        onCompleteWork={handleCompleteWork}
      />

      {reportModal.request && (
        <ReportRequestModal
          open={reportModal.open}
          onOpenChange={(open) => setReportModal({ ...reportModal, open })}
          request={reportModal.request}
        />
      )}

      <ChatPlaceholderDialog open={chatDialog} onOpenChange={setChatDialog} />
    </div>
  );
}
