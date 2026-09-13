"use client";

import { use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { DishManager } from "@/components/restaurants/DishManager";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage, restaurantApi } from "@/lib/api";

interface RestaurantDishesPageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantDishesPage({ params }: RestaurantDishesPageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ["restaurant-detail", id],
    queryFn: () => restaurantApi.getRestaurantById(id),
  });

  const canManageDishes =
    session?.user?.role === "admin" || restaurant?.approvalStatus === "approved";

  return (
    <div className="space-y-5">
      <Link
        href="/restaurants"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0097A7] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Zurück zur Restaurantverwaltung</span>
      </Link>

      <section className="rounded-3xl border border-[#F0ECE1] bg-white p-6 shadow-xs sm:p-8">
        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            {getApiErrorMessage(error, "Restaurant konnte nicht geladen werden.")}
          </div>
        ) : restaurant ? (
          <div className="space-y-7">
            <header className="flex flex-col justify-between gap-4 border-b border-[#F5F2E8] pb-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#0097A7]">
                  Gerichtverwaltung
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#1E1E1E]">
                  {restaurant.title}
                </h2>
                <p className="mt-1 text-sm text-[#718096]">
                  Signature-Gerichte und weitere Gerichte dieses Restaurants zentral verwalten.
                </p>
              </div>
              <Link
                href={`/restaurants/${restaurant._id}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#0097A7] px-4 text-sm font-semibold text-[#0097A7] transition-colors hover:bg-[#E0F7FA]"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Restaurantdetails</span>
              </Link>
            </header>

            {canManageDishes ? (
              <DishManager restaurant={restaurant} />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                Gerichte können vom Restaurantbesitzer verwaltet werden, sobald das Restaurant genehmigt wurde.
              </div>
            )}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-[#718096]">
            Restaurant nicht gefunden.
          </div>
        )}
      </section>
    </div>
  );
}
