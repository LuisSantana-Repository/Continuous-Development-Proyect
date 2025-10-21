/**
 * Skeleton component para el estado de carga
 * Muestra placeholders animados mientras cargan los datos
 */
export function ServiceDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-gray-300 to-gray-400 h-[400px] md:h-[500px]" />

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Details */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3" />
          <div className="h-48 bg-gray-300 rounded-2xl" />
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-300 rounded-2xl" />
          ))}
        </div>

        {/* Providers */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-gray-300 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3" />
          <div className="h-48 bg-gray-300 rounded-2xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-300 rounded-2xl" />
          ))}
        </div>

        {/* CTA */}
        <div className="h-64 bg-gray-300 rounded-2xl" />
      </div>
    </div>
  );
}
