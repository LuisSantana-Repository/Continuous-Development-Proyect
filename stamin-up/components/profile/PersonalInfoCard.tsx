import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientUser } from "@/types";

interface PersonalInfoCardProps {
  user: ClientUser;
}

export default function PersonalInfoCard({ user }: PersonalInfoCardProps) {
  const memberSinceDate = new Date(user.memberSince).toLocaleDateString(
    "es-MX",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const infoItems = [
    {
      icon: Mail,
      label: "Correo electrónico",
      value: user.email,
    },
    {
      icon: Phone,
      label: "Teléfono",
      value: user.phone,
    },
    {
      icon: MapPin,
      label: "Dirección",
      value: user.address,
    },
    {
      icon: Calendar,
      label: "Miembro desde",
      value: memberSinceDate,
    },
  ];

  return (
    <Card className="shadow-md transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="heading-sm text-primary">
          Información Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-[var(--color-background-secondary)]"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="body-sm text-muted mb-1">{item.label}</p>
                <p className="body-base text-primary font-medium break-words">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
