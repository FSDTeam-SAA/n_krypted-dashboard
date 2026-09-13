"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Check, ChefHat, Eye, Pencil, Plus, Search, Trash2, Utensils, X } from "lucide-react";
import { toast } from "sonner";
import {
  AdminRestaurantPayload,
  getApiErrorMessage,
  RestaurantItem,
  RestaurantPayload,
  restaurantApi,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantForm } from "@/components/restaurants/RestaurantForm";
import { RestaurantOwnerWorkspace } from "@/components/restaurants/RestaurantOwnerWorkspace";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function RestaurantManagementPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["restaurants", currentPage, searchQuery],
    queryFn: () =>
      restaurantApi.getAllRestaurants({
        page: currentPage,
        limit: 10,
        search: searchQuery,
      }),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (payload: AdminRestaurantPayload) => restaurantApi.createWithOwner(payload),
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingRestaurant(null);
      toast.success("Restaurant und Zugang des Restaurantbesitzers wurden erstellt.");
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Restaurant konnte nicht erstellt werden")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RestaurantPayload }) =>
      restaurantApi.updateRestaurant(id, payload),
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingRestaurant(null);
      toast.success("Restaurant wurde erfolgreich aktualisiert.");
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Restaurant konnte nicht aktualisiert werden")),
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) =>
      restaurantApi.updateApproval(id, status, reason),
    onSuccess: (_, variables) => {
      toast.success(variables.status === "approved" ? "Restaurant genehmigt" : "Restaurant abgelehnt");
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Genehmigung konnte nicht geändert werden")),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => restaurantApi.toggleStatus(id),
    onSuccess: () => {
      toast.success("Status des Restaurants erfolgreich geändert!");
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: () =>
      toast.error("Der Restaurantstatus konnte nicht geändert werden."),
  });

  const handleToggleStatus = (restaurant: RestaurantItem) => {
    toggleStatusMutation.mutate(restaurant._id);
  };

  const currentPageIds = data?.data.map((restaurant) => restaurant._id) ?? [];
  const allSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => restaurantApi.bulkDeleteRestaurants(ids),
    onSuccess: (result) => {
      setSelectedIds(new Set());
      setCurrentPage(1);
      toast.success(`${result.deletedCount} Restaurants wurden gelöscht.`);
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["top-reviews"] });
    },
    onError: (error: unknown) =>
      toast.error(
        getApiErrorMessage(error, "Die Restaurants konnten nicht gelöscht werden.")
      ),
  });

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCurrentPage = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) currentPageIds.forEach((id) => next.delete(id));
      else currentPageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkDelete = () => {
    const ids = [...selectedIds];
    if (
      ids.length > 0 &&
      window.confirm(
        `${ids.length} ausgewählte Restaurants dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
      )
    ) {
      bulkDeleteMutation.mutate(ids);
    }
  };

  if (!isAdmin) return <RestaurantOwnerWorkspace />;

  return (
    <div className="space-y-6">
      {/* Modal for Create / Edit Restaurant */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRestaurant(null);
        }}
        title={editingRestaurant ? "Restaurantdaten und Standort bearbeiten" : "Restaurant direkt erstellen"}
        description={
          editingRestaurant
            ? `Stammdaten, Vorschaubild und Kartenposition für "${editingRestaurant.title}" anpassen. Signature-Gerichte werden separat verwaltet.`
            : "Erstellt gleichzeitig den Zugang für den Restaurantbesitzer und genehmigt das Restaurant."
        }
        maxWidth="max-w-4xl"
      >
        <RestaurantForm
          key={editingRestaurant?._id || "create"}
          restaurant={editingRestaurant}
          includeOwner={!editingRestaurant}
          submitting={createMutation.isPending || updateMutation.isPending}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingRestaurant(null);
          }}
          onSubmit={(payload) => {
            if (editingRestaurant) {
              updateMutation.mutate({
                id: editingRestaurant._id,
                payload: payload as RestaurantPayload,
              });
            } else {
              createMutation.mutate(payload as AdminRestaurantPayload);
            }
          }}
        />
      </Modal>

      <section className="rounded-3xl border border-[#F0ECE1] bg-white p-6 shadow-xs sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-[#1E1E1E]">Alle Restaurants</h2>
            <p className="mt-0.5 text-xs text-[#718096] sm:text-sm">
              Alle Restaurants anzeigen, erstellen und verwalten.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-center">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingRestaurant(null);
                setIsModalOpen(true);
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                <span>Restaurant erstellen</span>
              </span>
            </Button>
            {isAdmin && selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>
                  {bulkDeleteMutation.isPending
                    ? "Wird gelöscht..."
                    : `${selectedIds.size} löschen`}
                </span>
              </button>
            )}
            <div className="relative w-full sm:min-w-64 sm:flex-1 lg:w-64 lg:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Restaurant suchen..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                  setSelectedIds(new Set());
                }}
                className="h-10 rounded-xl border-[#E2E8F0] pl-9 text-xs focus-visible:ring-[#0097A7]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#F0ECE1]">
          <table className="w-full min-w-[1120px] table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-[#F0ECE1] bg-[#FFFBE9] text-xs font-semibold text-[#1E1E1E]">
                {isAdmin && (
                  <th className="w-12 py-4 pl-5 pr-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleCurrentPage}
                      disabled={currentPageIds.length === 0}
                      aria-label="Alle Restaurants auf dieser Seite auswählen"
                      className="h-4 w-4 accent-[#0097A7]"
                    />
                  </th>
                )}
                <th className="w-64 px-5 py-4">Name des Restaurants</th>
                <th className="w-48 px-5 py-4">Standort</th>
                <th className="w-24 px-4 py-4 text-center">Bewertung</th>
                <th className="w-24 px-4 py-4 text-center">Rezension</th>
                      <th className="w-32 px-4 py-4 text-center">Signature-Gerichte</th>
                <th className="w-32 px-4 py-4 text-center">Genehmigung</th>
                <th className="w-56 py-4 pl-4 pr-6 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2E8] text-xs sm:text-sm">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: isAdmin ? 8 : 7 }).map((__, cell) => (
                      <td key={cell} className="px-5 py-3.5">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-gray-500">
                    Keine Restaurants gefunden.
                  </td>
                </tr>
              ) : (
                data?.data.map((restaurant) => {
                  const isActivated = restaurant.status === "activate";
                  const signatureDishCount = restaurant.dishes.filter(
                    (dish) => dish.isSignatureDish
                  ).length;
                  const location = [
                    restaurant.location?.city,
                    restaurant.location?.country,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr key={restaurant._id} className="transition-colors hover:bg-[#FFFDF5]">
                      {isAdmin && (
                        <td className="py-3.5 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(restaurant._id)}
                            onChange={() => toggleSelected(restaurant._id)}
                            aria-label={`${restaurant.title} auswählen`}
                            className="h-4 w-4 accent-[#0097A7]"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3.5 font-medium text-[#1E1E1E]">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                            {restaurant.images[0] ? (
                              <Image
                                src={restaurant.images[0]}
                                alt={restaurant.title}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            ) : (
                              <Utensils className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <span className="truncate">{restaurant.title}</span>
                        </div>
                      </td>
                      <td className="truncate px-5 py-3.5 text-[#718096]" title={location || undefined}>{location || "—"}</td>
                      <td className="px-4 py-3.5 text-center font-medium text-[#1E1E1E]">
                        {restaurant.rating.toFixed(1).replace(".", ",")}
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-[#1E1E1E]">
                        {restaurant.reviewCount}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          href={`/restaurants/${restaurant._id}/dishes`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-[#0097A7] hover:bg-[#E0F7FA]"
                          title="Signature-Gerichte verwalten"
                        >
                          <ChefHat className="h-4 w-4" />
                          <span>{signatureDishCount}/{restaurant.dishes.length}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={restaurant.approvalStatus === "approved" ? "active" : "inactive"}>
                          {restaurant.approvalStatus === "approved"
                            ? "Genehmigt"
                            : restaurant.approvalStatus === "rejected"
                            ? "Abgelehnt"
                            : "Ausstehend"}
                        </Badge>
                      </td>
                      <td className="py-3.5 pl-4 pr-5">
                        <div className="ml-auto grid w-44 grid-cols-5 items-center justify-items-center gap-1">
                          {isAdmin && restaurant.approvalStatus !== "approved" && (
                            <button
                              type="button"
                              onClick={() =>
                                approvalMutation.mutate({ id: restaurant._id, status: "approved" })
                              }
                              disabled={approvalMutation.isPending}
                              className="col-start-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                              title="Genehmigen"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && restaurant.approvalStatus === "pending" && (
                            <button
                              type="button"
                              onClick={() => {
                                const reason = window.prompt("Ablehnungsgrund");
                                if (reason)
                                  approvalMutation.mutate({
                                    id: restaurant._id,
                                    status: "rejected",
                                    reason,
                                  });
                              }}
                              disabled={approvalMutation.isPending}
                              className="col-start-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                              title="Ablehnen"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && restaurant.approvalStatus === "approved" && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(restaurant)}
                              disabled={toggleStatusMutation.isPending}
                              className="col-start-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#EF4444] transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              title={isActivated ? "Deaktivieren" : "Aktivieren"}
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <Link
                            href={`/restaurants/${restaurant._id}`}
                            className="col-start-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#0097A7] transition-colors hover:bg-[#E0F7FA] hover:text-[#00838F]"
                            title="Details anzeigen"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/restaurants/${restaurant._id}/dishes`}
                            className="col-start-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#0097A7] transition-colors hover:bg-[#E0F7FA] hover:text-[#00838F]"
                            title="Signature-Gerichte verwalten"
                          >
                            <ChefHat className="h-4 w-4" />
                          </Link>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRestaurant(restaurant);
                                setIsModalOpen(true);
                              }}
                              className="col-start-5 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#0097A7] transition-colors hover:bg-[#E0F7FA] hover:text-[#00838F]"
                              title="Restaurant bearbeiten"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data && (
          <Pagination
            currentPage={data.meta.currentPage}
            totalPages={data.meta.totalPages}
            totalItems={data.meta.totalItems}
            itemsPerPage={data.meta.itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              setSelectedIds(new Set());
            }}
            className="mt-2"
          />
        )}
      </section>
    </div>
  );
}
