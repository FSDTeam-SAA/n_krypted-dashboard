"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, UtensilsCrossed, ThumbsUp, Utensils, MapPinned } from "lucide-react";
import { statsApi, reviewApi } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { UserGrowthChart } from "@/components/dashboard/UserGrowthChart";
import { RestaurantBarChart } from "@/components/dashboard/RestaurantBarChart";
import { ActiveRestaurantsDonut } from "@/components/dashboard/ActiveRestaurantsDonut";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => statsApi.getDashboardStats(),
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["top-reviews"],
    queryFn: () => reviewApi.getAllReviews({ limit: 2 }),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-28 rounded-2xl bg-white" />
            <Skeleton className="h-28 rounded-2xl bg-white" />
            <Skeleton className="h-28 rounded-2xl bg-white" />
            <Skeleton className="h-28 rounded-2xl bg-white" />
            <Skeleton className="h-28 rounded-2xl bg-white" />
          </>
        ) : (
          <>
            <StatCard
              title="Gesamtzahl der Nutzer"
              value={formatNumber(stats?.totalUsers ?? 0)}
              icon={Users}
            />
            <StatCard
              title="Gesamtzahl der Restaurants"
              value={formatNumber(stats?.totalRestaurants ?? 0)}
              icon={UtensilsCrossed}
            />
            <StatCard
              title="Bewertungen insgesamt"
              value={(stats?.totalReviews ?? 0).toString()}
              icon={ThumbsUp}
            />
            <StatCard
              title="Verifizierte Check-ins"
              value={formatNumber(stats?.totalCheckIns ?? 0)}
              icon={MapPinned}
            />
            <StatCard
              title="Aktive Restaurants"
              value={`${stats?.activeRestaurantsPercent ?? 0} %`}
              icon={Utensils}
            />
          </>
        )}
      </div>

      {/* 2 Middle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statsLoading ? (
          <>
            <Skeleton className="h-80 rounded-2xl bg-white" />
            <Skeleton className="h-80 rounded-2xl bg-white" />
          </>
        ) : (
          <>
            <UserGrowthChart data={stats?.userGrowthData} />
            <RestaurantBarChart data={stats?.restaurantWeeklyData} />
          </>
        )}
      </div>

      {/* Bottom Section: Top Reviews & Active Restaurants Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top Reviews */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E1E1E]">
                Top-Bewertungen
              </h2>
              <p className="text-xs text-[#718096] mt-0.5">
                Sehen Sie sich die Top-Bewertungen von Nutzern an.
              </p>
            </div>

            <Link
              href="/reviews"
              className="text-xs sm:text-sm font-semibold text-[#0097A7] hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>

          {reviewsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 rounded-2xl bg-white" />
              <Skeleton className="h-44 rounded-2xl bg-white" />
            </div>
          ) : (
            <div className="space-y-4">
              {reviewsData?.data?.slice(0, 2).map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
              {reviewsData?.data.length === 0 && (
                <div className="rounded-2xl border border-[#F0ECE1] bg-white py-10 text-center text-sm text-[#718096]">
                  Keine Bewertungen gefunden.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Donut Chart */}
        <div className="lg:col-span-1">
          {statsLoading ? (
            <Skeleton className="h-96 rounded-2xl bg-white" />
          ) : (
            <ActiveRestaurantsDonut
              activePercent={stats?.activeRestaurantsPercent ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
