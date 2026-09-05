"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin, MessageSquareText, Star, Utensils } from "lucide-react";

import { reviewApi } from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["review-restaurants", currentPage],
    queryFn: () => reviewApi.getRestaurantSummaries({ page: currentPage, limit: 8 }),
  });

  return (
    <div className="space-y-6 rounded-3xl border border-[#F0ECE1] bg-white p-6 shadow-xs sm:p-8">
      <header className="flex flex-col gap-2 border-b border-[#F5F2E8] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1E1E1E]">Bewertungen nach Restaurant</h2>
          <p className="mt-1 text-xs text-[#718096] sm:text-sm">
            Restaurant auswählen, um alle zugehörigen Bewertungen zu sehen.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#E0F7FA] px-3 py-2 text-xs font-semibold text-[#00838F]">
          <MessageSquareText className="h-4 w-4" />
          {data?.meta.totalItems ?? 0} Restaurants gesamt
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm text-red-700">
            Die Bewertungsübersicht konnte nicht geladen werden.
          </div>
        ) : data?.data.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#718096]">
            Noch keine Restaurantbewertungen vorhanden.
          </div>
        ) : (
          data?.data.map((item) => {
            const image = item.restaurantImages?.[0];
            const location = [item.location?.city, item.location?.country]
              .filter(Boolean)
              .join(", ");
            return (
              <Link
                key={item.restaurantId}
                href={`/reviews/${item.restaurantId}`}
                className="group flex min-h-40 overflow-hidden rounded-2xl border border-[#F0ECE1] bg-white shadow-2xs transition-all hover:-translate-y-0.5 hover:border-[#B2EBF2] hover:shadow-md"
              >
                <div className="relative w-36 shrink-0 bg-[#F1F5F9] sm:w-44">
                  {image ? (
                    <Image
                      src={image}
                      alt={item.restaurantName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="176px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Utensils className="h-8 w-8 text-[#94A3B8]" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="truncate text-base font-bold text-[#1E1E1E]">
                      {item.restaurantName}
                    </h3>
                    {location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#718096]">
                        <MapPin className="h-3.5 w-3.5 text-red-500" />
                        <span className="truncate">{location}</span>
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="flex gap-5">
                      <div>
                        <div className="flex items-center gap-1 text-lg font-bold text-[#1E1E1E]">
                          {item.averageRating.toFixed(1)}
                          <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                        </div>
                        <p className="text-[11px] text-[#718096]">Durchschnitt</p>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#1E1E1E]">
                          {item.totalReviews}
                        </div>
                        <p className="text-[11px] text-[#718096]">Bewertungen</p>
                      </div>
                    </div>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E0F7FA] text-[#0097A7] transition-transform group-hover:translate-x-1">
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={data.meta.currentPage}
          totalPages={data.meta.totalPages}
          totalItems={data.meta.totalItems}
          itemsPerPage={data.meta.itemsPerPage}
          onPageChange={setCurrentPage}
          className="border-t border-[#F5F2E8] pt-5"
        />
      )}
    </div>
  );
}
