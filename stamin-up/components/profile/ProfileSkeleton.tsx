export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Skeleton */}
      <section className="bg-[var(--color-background-secondary)] py-12 md:py-16">
        <div className="app-container">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-lg md:p-12">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              {/* Avatar Skeleton */}
              <div className="h-32 w-32 animate-pulse rounded-full bg-gray-200" />

              {/* Info Skeleton */}
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
              </div>

              {/* Button Skeleton */}
              <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="py-12 md:py-16">
        <div className="app-container">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
            </div>

            {/* Main Content Skeleton */}
            <div className="space-y-8 lg:col-span-2">
              {/* Section 1 */}
              <div className="space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
                <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
              </div>

              {/* Section 2 */}
              <div className="space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-56 animate-pulse rounded-2xl bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
