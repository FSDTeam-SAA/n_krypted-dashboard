"use client";

import Image from "next/image";
import { Calendar, Clock, MapPin, Star, User, Users, Utensils } from "lucide-react";
import { ReviewItem } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";

interface ReviewCardProps {
  review: ReviewItem;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const rating = review.ratings ?? 0;

  return (
    <div className="rounded-2xl border border-[#F0ECE1] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#F7F5EC] pb-3">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          {review.restaurantAvatar ? (
            <Image
              src={review.restaurantAvatar}
              alt={review.restaurantName ?? "Restaurant"}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <Utensils className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold leading-tight text-[#1E1E1E]">
            {review.restaurantName ?? "Eintrag nicht verf\u00fcgbar"}
          </h4>
          {review.restaurantLocation && (
            <div className="flex items-center gap-1 text-[11px] text-[#718096]">
              <MapPin className="h-3 w-3 shrink-0 text-red-500" />
              <span>{review.restaurantLocation}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-4 lg:flex-row">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {review.userID?.avatar ? (
                  <Image
                    src={review.userID.avatar}
                    alt={review.userID.name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1E1E1E]">
                  {review.reviewType === 'sd_admin' ? `★ Signature Dish Team · ${review.adminAuthor?.name || ''}` : review.userID?.name ?? "Benutzer nicht verf\u00fcgbar"}
                  {review.status === 'hidden' && <span className="ml-2 rounded bg-amber-100 px-2 text-xs">Ausgeblendet</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= rating
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-[#0097A7]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(review.checkInID?.checkedInAt ?? review.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(review.checkInID?.checkedInAt ?? review.createdAt)}</span>
            </div>
            {review.dishName && (
              <div className="flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5" />
                <span>{review.dishName}</span>
              </div>
            )}
            {review.checkInID && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{review.checkInID.partySize} Personen</span>
              </div>
            )}
          </div>

          <p className="pt-1 text-xs leading-relaxed text-[#4A5568] sm:text-sm">
            {review.reviewComment}
          </p>
        </div>

        {review.dishImage && (
          <div className="group relative h-32 w-full shrink-0 overflow-hidden rounded-xl shadow-xs lg:w-44">
            <Image
              src={review.dishImage}
              alt={review.dishName ?? "Gericht"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="180px"
            />
            {review.dishName && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                <Utensils className="h-3 w-3" />
                <span>{review.dishName}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
