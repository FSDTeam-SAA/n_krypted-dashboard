"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  Check,
  ChefHat,
  MapPin,
  MessageSquare,
  Pencil,
  Star,
  ThumbsUp,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, RestaurantPayload, restaurantApi, reviewApi } from "@/lib/api";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { RestaurantForm } from "@/components/restaurants/RestaurantForm";
import { Modal } from "@/components/ui/modal";

interface RestaurantDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantDetailsPage({ params }: RestaurantDetailsPageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant-detail", id],
    queryFn: () => restaurantApi.getRestaurantById(id),
  });
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["restaurant-reviews", id],
    queryFn: () => reviewApi.getAllReviews({ dealId: id, limit: 6 }),
  });
  const updateMutation = useMutation({
    mutationFn: (payload: RestaurantPayload) =>
      restaurantApi.updateRestaurant(id, payload),
    onSuccess: () => {
      setIsEditModalOpen(false);
      toast.success("Restaurant erfolgreich aktualisiert.");
      queryClient.invalidateQueries({ queryKey: ["restaurant-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Restaurant konnte nicht aktualisiert werden.")),
  });
  const toggleStatusMutation = useMutation({
    mutationFn: () => restaurantApi.toggleStatus(id),
    onSuccess: () => {
      toast.success("Status des Restaurants erfolgreich ge\u00e4ndert!");
      queryClient.invalidateQueries({ queryKey: ["restaurant-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: () =>
      toast.error("Der Restaurantstatus konnte nicht ge\u00e4ndert werden."),
  });
  const approvalMutation = useMutation({
    mutationFn: ({ status, rejectionReason }: { status: "approved" | "rejected"; rejectionReason?: string }) =>
      restaurantApi.updateApproval(id, status, rejectionReason),
    onSuccess: () => {
      toast.success("Restaurantgenehmigung aktualisiert");
      queryClient.invalidateQueries({ queryKey: ["restaurant-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: () => toast.error("Restaurantgenehmigung konnte nicht aktualisiert werden."),
  });

  const location = [restaurant?.location?.city, restaurant?.location?.country]
    .filter(Boolean)
    .join(", ");
  const category =
    typeof restaurant?.category === "object"
      ? restaurant.category.categoryName
      : undefined;

  return (
    <div className="space-y-8 rounded-3xl border border-[#F0ECE1] bg-white p-6 shadow-xs sm:p-8">
      {restaurant && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Restaurantdaten und Standort bearbeiten"
          description={`Stammdaten, Vorschaubild und Kartenposition für "${restaurant.title}" anpassen. Signature-Gerichte werden separat verwaltet.`}
          maxWidth="max-w-4xl"
        >
          <RestaurantForm
            key={restaurant._id}
            restaurant={restaurant}
            includeOwner={false}
            submitting={updateMutation.isPending}
            onCancel={() => setIsEditModalOpen(false)}
            onSubmit={(payload) => updateMutation.mutate(payload as RestaurantPayload)}
          />
        </Modal>
      )}

      <Link
        href="/restaurants"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#0097A7] hover:underline sm:text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Zurück zur Restaurantverwaltung</span>
      </Link>

      {isLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : restaurant ? (
        <div className="flex flex-col justify-between gap-6 border-b border-[#F5F2E8] pb-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {restaurant.images[0] ? (
                <Image
                  src={restaurant.images[0]}
                  alt={restaurant.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <Utensils className="h-7 w-7 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E1E1E]">
                {restaurant.title}
              </h2>
              {category && <p className="text-xs text-[#718096]">{category}</p>}
            </div>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-xs text-[#4A5568] sm:text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-red-500" />
              <span>{location}</span>
            </div>
          )}

          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/restaurants/${restaurant._id}/dishes`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0097A7] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00838F]"
              >
                <ChefHat className="h-4 w-4" />
                <span>Signature-Gerichte verwalten</span>
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="flex h-11 items-center gap-2 rounded-xl px-4 border-[#0097A7] text-[#0097A7] hover:bg-[#E0F7FA]"
              >
                <Pencil className="h-4 w-4" />
                <span>Bearbeiten</span>
              </Button>
              {restaurant.approvalStatus !== "approved" && (
                <Button
                  onClick={() => approvalMutation.mutate({ status: "approved" })}
                  disabled={approvalMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" />
                  <span>Genehmigen</span>
                </Button>
              )}
              {restaurant.approvalStatus === "pending" && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = window.prompt("Ablehnungsgrund");
                    if (reason)
                      approvalMutation.mutate({
                        status: "rejected",
                        rejectionReason: reason,
                      });
                  }}
                  disabled={approvalMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  <span>Ablehnen</span>
                </Button>
              )}
              {restaurant.approvalStatus === "approved" && (
                <Button
                  variant="destructive"
                  onClick={() => toggleStatusMutation.mutate()}
                  disabled={toggleStatusMutation.isPending}
                  className="flex h-11 items-center gap-2 rounded-xl px-6"
                >
                  <Ban className="h-4 w-4" />
                  <span>
                    {restaurant.status === "activate" ? "Sperren" : "Entsperren"}
                  </span>
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-[#718096]">
          Restaurant nicht gefunden.
        </div>
      )}

      {restaurant && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Durchschnittliche Bewertung",
                value: restaurant.rating.toFixed(1).replace(".", ","),
                icon: Star,
              },
              {
                label: "Bewertungen insgesamt",
                value: restaurant.reviewCount.toString(),
                icon: MessageSquare,
              },
              {
                label: "Check-ins insgesamt",
                value: restaurant.totalCheckIns.toString(),
                icon: ThumbsUp,
              },
              {
                label: "Preis",
                value: formatPrice(restaurant.price),
                icon: WalletCards,
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between rounded-2xl border border-[#FEEFB3] bg-[#FFF9E6] p-4"
              >
                <div className="flex items-center gap-3">
                  <metric.icon className="h-5 w-5 text-[#0097A7]" />
                  <span className="text-xs font-medium leading-tight text-[#718096]">
                    {metric.label}
                  </span>
                </div>
                <span className="text-lg font-bold text-[#1E1E1E]">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>

          <section className="space-y-4">
            <h3 className="text-base font-bold text-[#1E1E1E]">Beschreibung</h3>
            <p className="text-sm leading-relaxed text-[#718096]">
              {restaurant.description}
            </p>
          </section>

          <section className="space-y-4 border-t border-[#F5F2E8] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1E1E]">Bilder</h3>
              <span className="text-xs text-[#718096]">
                {restaurant.images.length} Ergebnisse
              </span>
            </div>
            {restaurant.images.length === 0 ? (
              <div className="rounded-xl border border-[#F0ECE1] py-8 text-center text-sm text-[#718096]">
                Keine Bilder vorhanden.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {restaurant.images.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative h-44 overflow-hidden rounded-2xl shadow-2xs"
                  >
                    <Image
                      src={image}
                      alt={`${restaurant.title} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-[#F5F2E8] pt-4">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#1E1E1E]">Angebote</h3>
              {restaurant.offers.length === 0 ? (
                <p className="text-sm text-[#718096]">Keine Angebote vorhanden.</p>
              ) : (
                <ul className="space-y-2">
                  {restaurant.offers.map((offer, index) => (
                    <li key={`${offer}-${index}`} className="flex items-start gap-2 text-sm text-[#4A5568]">
                      <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-[#0097A7]" />
                      <span>{offer}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-[#F5F2E8] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1E1E1E]">Rezensionen</h3>
              <span className="text-xs text-[#718096]">
                {reviewsData?.meta.totalItems ?? 0} Ergebnisse
              </span>
            </div>
            {reviewsLoading ? (
              <Skeleton className="h-44 rounded-2xl" />
            ) : reviewsData?.data.length ? (
              <div className="space-y-4">
                {reviewsData.data.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#F0ECE1] py-8 text-center text-sm text-[#718096]">
                Keine Bewertungen gefunden.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
