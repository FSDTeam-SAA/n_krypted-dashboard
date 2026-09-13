"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  Store,
  Utensils,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage, RestaurantPayload, restaurantApi } from "@/lib/api";
import { RestaurantForm } from "./RestaurantForm";
import { DishManager } from "./DishManager";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export function RestaurantOwnerWorkspace() {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["my-restaurant"],
    queryFn: restaurantApi.getMine,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: RestaurantPayload) =>
      restaurant?.approvalStatus === "rejected"
        ? restaurantApi.resubmitMine(restaurant._id, payload)
        : restaurantApi.submitMine(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-restaurant"], updated);
      queryClient.invalidateQueries({ queryKey: ["my-restaurant"] });
      toast.success("Restaurant wurde zur Genehmigung eingereicht.");
    },
    onError: (error: unknown) =>
      toast.error(
        getApiErrorMessage(error, "Restaurant konnte nicht eingereicht werden")
      ),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: RestaurantPayload) => {
      if (!restaurant) throw new Error("Kein Restaurant vorhanden");
      return restaurantApi.updateRestaurant(restaurant._id, payload);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-restaurant"], updated);
      queryClient.invalidateQueries({ queryKey: ["my-restaurant"] });
      setIsEditModalOpen(false);
      toast.success("Restaurantangaben wurden erfolgreich aktualisiert.");
    },
    onError: (error: unknown) =>
      toast.error(
        getApiErrorMessage(
          error,
          "Restaurantangaben konnten nicht aktualisiert werden"
        )
      ),
  });

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  // Case 1: No restaurant yet or Rejected by admin
  if (!restaurant || restaurant.approvalStatus === "rejected") {
    return (
      <section className="space-y-6 rounded-3xl border border-[#F0ECE1] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-start gap-3">
          {restaurant ? (
            <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
          ) : (
            <Store className="mt-0.5 h-6 w-6 shrink-0 text-[#0097A7]" />
          )}
          <div>
            <h2 className="text-xl font-bold text-[#1E1E1E]">
              {restaurant
                ? "Restaurant überarbeiten & erneut einreichen"
                : "Eigenes Restaurant erstellen"}
            </h2>
            <p className="mt-1 text-sm text-[#718096]">
              {restaurant
                ? `Ablehnungsgrund: ${restaurant.rejectionReason || "Keine Angabe"}`
                : "Fülle das Formular aus und wähle den genauen Standort auf der Karte."}
            </p>
          </div>
        </div>
        <RestaurantForm
          restaurant={restaurant}
          includeOwner={false}
          submitting={submitMutation.isPending}
          onSubmit={(payload) =>
            submitMutation.mutate(payload as RestaurantPayload)
          }
        />
      </section>
    );
  }

  // Case 2: Waiting for admin approval
  if (restaurant.approvalStatus === "pending") {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-xs">
        <Clock3 className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="mt-4 text-xl font-bold text-amber-900">
          Restaurant wartet auf Genehmigung
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-amber-800">
          Ihr Restaurant „{restaurant.title}“ wurde eingereicht. Sobald es von einem Administrator genehmigt wurde, sind Ihre Gerichte und Signature-Gerichte für Kunden sichtbar.
        </p>
      </section>
    );
  }

  // Case 3: Approved & Active Restaurant
  const location = [
    restaurant.location?.address,
    restaurant.location?.city,
    restaurant.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const category =
    typeof restaurant.category === "object"
      ? restaurant.category?.categoryName
      : undefined;

  return (
    <div className="space-y-6">
      {/* Edit Modal for Approved Restaurant */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Restaurantangaben bearbeiten"
        description={`Bearbeiten Sie die Details und den Standort von „${restaurant.title}“.`}
        maxWidth="max-w-4xl"
      >
        <RestaurantForm
          key={restaurant._id}
          restaurant={restaurant}
          includeOwner={false}
          submitting={updateMutation.isPending}
          onCancel={() => setIsEditModalOpen(false)}
          onSubmit={(payload) =>
            updateMutation.mutate(payload as RestaurantPayload)
          }
        />
      </Modal>

      {/* Restaurant Status & Overview Card */}
      <section className="rounded-3xl border border-[#F0ECE1] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center border-b border-[#F5F2E8] pb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 border border-[#F0ECE1]">
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#1E1E1E]">
                  {restaurant.title}
                </h2>
                <Badge variant="active">Genehmigt</Badge>
              </div>
              {category && <p className="text-xs text-[#718096] mt-0.5">{category}</p>}
              {location && (
                <div className="flex items-center gap-1.5 text-xs text-[#4A5568] mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border-[#0097A7] text-[#0097A7] hover:bg-[#E0F7FA]"
          >
            <Pencil className="h-4 w-4" />
            <span>Restaurant bearbeiten</span>
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 rounded-xl p-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Ihr Restaurant ist veröffentlicht und in der mobilen App auffindbar. Verwalten Sie unten Ihre Gerichte und Signature-Gerichte.
          </span>
        </div>
      </section>

      {/* Dish Management Section */}
      <DishManager restaurant={restaurant} />
    </div>
  );
}
