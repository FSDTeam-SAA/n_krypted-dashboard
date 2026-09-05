"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Pencil, Star, Trash2, Utensils } from "lucide-react";
import { toast } from "sonner";

import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getApiErrorMessage,
  restaurantApi,
  reviewApi,
  type ReviewItem,
} from "@/lib/api";

export default function RestaurantReviewsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = session?.user?.role === "admin";
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [deleting, setDeleting] = useState<ReviewItem | null>(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  const restaurantQuery = useQuery({
    queryKey: ["review-restaurant", restaurantId],
    queryFn: () => restaurantApi.getRestaurantById(restaurantId),
    enabled: Boolean(restaurantId),
  });
  const reviewsQuery = useQuery({
    queryKey: ["restaurant-review-list", restaurantId, page],
    queryFn: () => reviewApi.getAllReviews({ dealId: restaurantId, page, limit: 6 }),
    enabled: Boolean(restaurantId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant-review-list", restaurantId] });
    queryClient.invalidateQueries({ queryKey: ["review-restaurant", restaurantId] });
    queryClient.invalidateQueries({ queryKey: ["review-restaurants"] });
    queryClient.invalidateQueries({ queryKey: ["top-reviews"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; reviewComment: string; ratings: number }) =>
      reviewApi.updateReview(payload.id, payload),
    onSuccess: () => {
      setEditing(null);
      invalidate();
      toast.success("Bewertung wurde aktualisiert.");
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Bewertung konnte nicht aktualisiert werden.")),
  });
  const deleteMutation = useMutation({
    mutationFn: reviewApi.deleteReview,
    onSuccess: () => {
      setDeleting(null);
      invalidate();
      toast.success("Bewertung wurde gelöscht.");
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Bewertung konnte nicht gelöscht werden.")),
  });

  const restaurant = restaurantQuery.data;
  const image = restaurant?.images?.[0];
  const location = [restaurant?.location?.city, restaurant?.location?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <Link
        href="/reviews"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0097A7] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu allen Restaurants
      </Link>

      <section className="overflow-hidden rounded-3xl border border-[#F0ECE1] bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-48 w-full shrink-0 bg-[#F1F5F9] sm:h-auto sm:w-64">
            {image ? (
              <Image src={image} alt={restaurant?.title ?? "Restaurant"} fill className="object-cover" sizes="256px" />
            ) : (
              <div className="flex h-full min-h-44 items-center justify-center">
                <Utensils className="h-10 w-10 text-[#94A3B8]" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
            {restaurantQuery.isLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-[#0097A7]">Restaurantbewertungen</p>
                <h1 className="mt-1 text-2xl font-bold text-[#1E1E1E]">{restaurant?.title ?? "Restaurant"}</h1>
                {location && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-[#718096]">
                    <MapPin className="h-4 w-4 text-red-500" /> {location}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  <div className="rounded-xl bg-[#FFF8E2] px-4 py-2">
                    <div className="flex items-center gap-1 text-lg font-bold text-[#1E1E1E]">
                      {(restaurant?.rating ?? 0).toFixed(1)}
                      <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                    </div>
                    <p className="text-[11px] text-[#718096]">Durchschnitt</p>
                  </div>
                  <div className="rounded-xl bg-[#E0F7FA] px-4 py-2">
                    <div className="text-lg font-bold text-[#1E1E1E]">{reviewsQuery.data?.meta.totalItems ?? restaurant?.reviewCount ?? 0}</div>
                    <p className="text-[11px] text-[#718096]">Bewertungen gesamt</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-[#F0ECE1] bg-white p-6 shadow-xs sm:p-8">
        <div className="border-b border-[#F5F2E8] pb-4">
          <h2 className="text-lg font-bold text-[#1E1E1E]">Alle Bewertungen</h2>
          <p className="text-xs text-[#718096]">Neueste Bewertungen werden zuerst angezeigt.</p>
        </div>
        {reviewsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)
        ) : reviewsQuery.data?.data.length ? (
          reviewsQuery.data.data.map((review) => (
            <div key={review._id}>
              <ReviewCard review={review} />
              {isAdmin && (
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(review);
                      setComment(review.reviewComment);
                      setRating(review.ratings);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B2EBF2] px-3 text-xs font-semibold text-[#00838F] hover:bg-[#E0F7FA]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(review)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Löschen
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-14 text-center text-sm text-[#718096]">Keine Bewertungen gefunden.</div>
        )}
        {reviewsQuery.data && reviewsQuery.data.meta.totalPages > 1 && (
          <Pagination
            currentPage={reviewsQuery.data.meta.currentPage}
            totalPages={reviewsQuery.data.meta.totalPages}
            totalItems={reviewsQuery.data.meta.totalItems}
            itemsPerPage={reviewsQuery.data.meta.itemsPerPage}
            onPageChange={setPage}
            className="border-t border-[#F5F2E8] pt-5"
          />
        )}
      </section>

      <Modal
        isOpen={editing !== null}
        onClose={() => !updateMutation.isPending && setEditing(null)}
        title="Bewertung bearbeiten"
        description="Bewertungstext und Sterne aktualisieren."
        maxWidth="max-w-lg"
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (editing && comment.trim()) {
              updateMutation.mutate({ id: editing._id, reviewComment: comment.trim(), ratings: rating });
            }
          }}
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" onClick={() => setRating(value)} className="rounded-lg p-1">
                <Star className={`h-7 w-7 ${value <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={6}
            maxLength={1000}
            required
            className="w-full resize-y rounded-xl border border-[#90CAF9] p-3 text-sm outline-none focus:ring-2 focus:ring-[#0097A7]"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-xl border px-4 text-sm">Abbrechen</button>
            <button type="submit" disabled={updateMutation.isPending || !comment.trim()} className="h-10 rounded-xl bg-[#0097A7] px-5 text-sm font-semibold text-white disabled:opacity-50">
              {updateMutation.isPending ? "Wird gespeichert..." : "Speichern"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleting !== null}
        onClose={() => !deleteMutation.isPending && setDeleting(null)}
        title="Bewertung löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Die Bewertung von {deleting?.userID?.name ?? "diesem Benutzer"} wird dauerhaft gelöscht.
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeleting(null)} className="h-10 rounded-xl border px-4 text-sm">Abbrechen</button>
            <button type="button" onClick={() => deleting && deleteMutation.mutate(deleting._id)} disabled={deleteMutation.isPending} className="h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-50">
              {deleteMutation.isPending ? "Wird gelöscht..." : "Dauerhaft löschen"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
