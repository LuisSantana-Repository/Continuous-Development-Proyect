import { Package } from "lucide-react";
import OrderCard from "./OrderCard";
import type { Order } from "@/types";

interface OrdersListProps {
  orders: Order[];
  isLoading: boolean;
}

export default function OrdersList({ orders, isLoading }: OrdersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-background-secondary)] p-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
          <Package className="h-10 w-10 text-muted" />
        </div>
        <h3 className="heading-sm text-primary mb-2">
          No hay servicios solicitados
        </h3>
        <p className="body-base text-secondary max-w-md">
          Aún no has solicitado ningún servicio. Explora nuestra plataforma y
          encuentra el profesional perfecto para tu próximo proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
