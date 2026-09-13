"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChefHat, ImagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  DishItem,
  DishPayload,
  getApiErrorMessage,
  RestaurantItem,
  restaurantApi,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

const maxDishImages = 6;

const existingDishImages = (dish: DishItem): string[] => {
  const images = (dish.images ?? []).filter(Boolean);
  if (images.length > 0) return images;
  return dish.image ? [dish.image] : [];
};

const emptyDish: DishPayload = {
  name: "",
  description: "",
  price: 0,
  image: "",
  images: [],
  imageFiles: [],
  category: "",
  specialtyDescription: "",
  ingredients: [],
  preparationProcess: "",
  isSignatureDish: false,
  isActive: true,
};

export function DishManager({ restaurant }: { restaurant: RestaurantItem }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<DishItem | null>(null);
  const [form, setForm] = useState<DishPayload>(emptyDish);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const blobUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => blobUrls.current.forEach(URL.revokeObjectURL);
  }, []);

  const clearNewPreviews = () => {
    blobUrls.current.forEach(URL.revokeObjectURL);
    blobUrls.current = [];
    setNewPreviewUrls([]);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(emptyDish);
    clearNewPreviews();
    setShowForm(false);
  };

  const updateRestaurantCaches = (updated: RestaurantItem) => {
    queryClient.setQueryData(["restaurant-detail", restaurant._id], updated);
    queryClient.setQueryData(["my-restaurant"], updated);
    queryClient.invalidateQueries({ queryKey: ["restaurants"] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: DishPayload) =>
      editing
        ? restaurantApi.updateDish(restaurant._id, editing._id, payload)
        : restaurantApi.addDish(restaurant._id, payload),
    onSuccess: (updated) => {
      updateRestaurantCaches(updated);
      toast.success(editing ? "Gericht aktualisiert" : "Gericht hinzugefügt");
      closeForm();
    },
    onError: (error: unknown) =>
      toast.error(
        getApiErrorMessage(error, "Gericht konnte nicht gespeichert werden")
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (dishId: string) =>
      restaurantApi.deleteDish(restaurant._id, dishId),
    onSuccess: (updated) => {
      updateRestaurantCaches(updated);
      toast.success("Gericht gelöscht");
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Gericht konnte nicht gelöscht werden")),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if ((form.images?.length ?? 0) + (form.imageFiles?.length ?? 0) === 0) {
      toast.error("Bitte laden Sie mindestens ein Gerichtsbild hoch.");
      return;
    }
    saveMutation.mutate({
      ...form,
      name: form.name.trim(),
      ingredients: (form.ingredients ?? [])
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  const openCreateForm = () => {
    setEditing(null);
    setForm(emptyDish);
    clearNewPreviews();
    setShowForm(true);
  };

  const edit = (dish: DishItem) => {
    setEditing(dish);
    setForm({
      name: dish.name,
      description: dish.description ?? "",
      price: dish.price,
      image: dish.image ?? "",
      images: existingDishImages(dish),
      imageFiles: [],
      category: dish.category ?? "",
      specialtyDescription: dish.specialtyDescription ?? "",
      ingredients: dish.ingredients ?? [],
      preparationProcess: dish.preparationProcess ?? "",
      isSignatureDish: dish.isSignatureDish,
      isActive: dish.isActive,
    });
    clearNewPreviews();
    setShowForm(true);
  };

  const selectImages = (files?: FileList | null) => {
    if (!files?.length) return;
    const available = Math.max(
      0,
      maxDishImages -
        ((form.images?.length ?? 0) + (form.imageFiles?.length ?? 0))
    );
    const selected = Array.from(files).slice(0, available);
    if (selected.length === 0) {
      toast.error(`Maximal ${maxDishImages} Bilder sind erlaubt.`);
      return;
    }
    const urls = selected.map((file) => URL.createObjectURL(file));
    blobUrls.current.push(...urls);
    setForm((current) => ({
      ...current,
      imageFiles: [...(current.imageFiles ?? []), ...selected],
    }));
    setNewPreviewUrls((current) => [...current, ...urls]);
    if (selected.length < files.length) {
      toast.info(`Es können maximal ${maxDishImages} Bilder gespeichert werden.`);
    }
  };

  const removeExistingImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: (current.images ?? []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const removeNewImage = (index: number) => {
    const url = newPreviewUrls[index];
    if (url) {
      URL.revokeObjectURL(url);
      blobUrls.current = blobUrls.current.filter((item) => item !== url);
    }
    setNewPreviewUrls((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
    setForm((current) => ({
      ...current,
      imageFiles: (current.imageFiles ?? []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const signatureCount = restaurant.dishes.filter(
    (dish) => dish.isSignatureDish
  ).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#1E1E1E]">Signature-Gerichte</h3>
            <span className="rounded-full bg-[#FFF3BF] px-2.5 py-1 text-xs font-semibold text-[#7A5D00]">
              {signatureCount} Signature / {restaurant.dishes.length} gesamt
            </span>
          </div>
          <p className="mt-1 text-xs text-[#718096] sm:text-sm">
            Gerichte erstellen, bearbeiten, veröffentlichen und als besondere Spezialität markieren.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreateForm}>
          <span className="inline-flex items-center">
            <Plus className="mr-1 h-4 w-4" />
            <span>Gericht hinzufügen</span>
          </span>
        </Button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        maxWidth="max-w-5xl"
        title={editing ? "Gericht bearbeiten" : "Neues Gericht hinzufügen"}
        description="Gerichtsdaten und bis zu 6 Bilder verwalten. Alle Angaben werden in der App aus echten Daten angezeigt."
      >
        <form
          key={editing?._id ?? "new-dish"}
          onSubmit={submit}
          className="grid gap-5 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#334155]">
            <span>Name des Gerichts</span>
            <Input
              required
              placeholder="z. B. Signature Trüffel Pasta"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#334155]">
            <span>Preis (€)</span>
            <Input
              required
              min="0"
              step="0.01"
              type="number"
              placeholder="0,00"
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: Number(event.target.value) })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#334155] sm:col-span-2">
            <span>Kategorie</span>
            <Input
              placeholder="z. B. Hauptspeise, Vorspeise"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            />
          </label>

          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#334155]">Gerichtsbilder</p>
                <p className="mt-1 text-xs text-[#718096]">
                  JPG, PNG oder WebP · maximal {maxDishImages} Bilder
                </p>
              </div>
              <span className="rounded-full bg-[#E8F8FA] px-2.5 py-1 text-xs font-semibold text-[#007E93]">
                {(form.images?.length ?? 0) + (form.imageFiles?.length ?? 0)}/{maxDishImages}
              </span>
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#90CAF9] bg-[#F8FCFD] px-4 py-5 text-sm font-semibold text-[#0097A7] transition-colors hover:bg-[#ECFAFC]">
              <ImagePlus className="h-5 w-5" />
              <span>Mehrere Bilder auswählen</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  selectImages(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {((form.images?.length ?? 0) > 0 || newPreviewUrls.length > 0) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(form.images ?? []).map((url, index) => (
                  <div
                    key={`existing-${url}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E3E8EE] bg-slate-50"
                  >
                    <Image
                      src={url}
                      alt={`Gerichtsbild ${index + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="(max-width: 640px) 50vw, 280px"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                        Hauptbild
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-red-500 shadow"
                      title="Bild entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {newPreviewUrls.map((url, index) => (
                  <div
                    key={url}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#8ED9E2] bg-slate-50"
                  >
                    <Image
                      src={url}
                      alt={`Neues Gerichtsbild ${index + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="(max-width: 640px) 50vw, 280px"
                      unoptimized
                    />
                    {(form.images?.length ?? 0) === 0 && index === 0 && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                        Hauptbild
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-red-500 shadow"
                      title="Bild entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#334155] sm:col-span-2">
            <span>Beschreibung</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-[#90CAF9] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#0097A7]"
              placeholder="Beschreibung des Gerichts..."
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#334155] sm:col-span-2">
            <span>Spezialität des Gerichts (optional)</span>
            <textarea
              className="min-h-20 w-full rounded-xl border border-[#90CAF9] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#0097A7]"
              placeholder="Was macht dieses Gericht besonders?"
              value={form.specialtyDescription}
              onChange={(event) =>
                setForm({ ...form, specialtyDescription: event.target.value })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#334155]">
            <span>Hauptzutaten (durch Komma trennen)</span>
            <Input
              placeholder="z. B. Rindfleisch, Salz, Pfeffer"
              value={(form.ingredients ?? []).join(", ")}
              onChange={(event) =>
                setForm({
                  ...form,
                  ingredients: [event.target.value],
                })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#334155]">
            <span>Zubereitungsmethode (optional)</span>
            <textarea
              className="min-h-20 w-full rounded-xl border border-[#90CAF9] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#0097A7]"
              placeholder="Zubereitung des Gerichts beschreiben..."
              value={form.preparationProcess}
              onChange={(event) =>
                setForm({ ...form, preparationProcess: event.target.value })
              }
            />
          </label>

          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-[#FEEFB3] bg-white p-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isSignatureDish}
                onChange={(event) =>
                  setForm({ ...form, isSignatureDish: event.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-[#0097A7]"
              />
              <span>
                <strong className="block">Signature-Gericht</strong>
                <small className="text-[#718096]">Als besondere Spezialität hervorheben.</small>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[#FEEFB3] bg-white p-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm({ ...form, isActive: event.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-[#0097A7]"
              />
              <span>
                <strong className="block">In der App aktiv</strong>
                <small className="text-[#718096]">Für Nutzer anzeigen und auswählbar machen.</small>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>
              Abbrechen
            </Button>
            <Button type="submit" size="sm" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Wird gespeichert..."
                : editing
                  ? "Änderungen speichern"
                  : "Gericht hinzufügen"}
            </Button>
          </div>
        </form>
      </Modal>

      {restaurant.dishes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CBD5E1] p-10 text-center text-sm text-[#718096]">
          <ChefHat className="mx-auto mb-3 h-9 w-9" />
          <p className="font-semibold text-[#334155]">Noch keine Gerichte vorhanden.</p>
          <p className="mt-1">Fügen Sie das erste Gericht oder Signature-Gericht hinzu.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {restaurant.dishes.map((dish) => (
            <article
              key={dish._id}
              className={`overflow-hidden rounded-2xl border bg-white ${
                dish.isSignatureDish ? "border-[#F2CE5C]" : "border-[#F0ECE1]"
              }`}
            >
              <div className="relative h-56 bg-slate-50">
                {existingDishImages(dish)[0] ? (
                  <Image
                    src={existingDishImages(dish)[0]}
                    alt={dish.name}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <ChefHat className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
                )}
                {existingDishImages(dish).length > 1 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                    {existingDishImages(dish).length} Bilder
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate font-bold">{dish.name}</h4>
                      {dish.isSignatureDish && (
                        <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#718096]">
                      {dish.category || "Ohne Kategorie"}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-[#0097A7]">
                    €{dish.price.toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dish.isSignatureDish && (
                    <span className="rounded-full bg-[#FFF3BF] px-2 py-1 text-[11px] font-semibold text-[#7A5D00]">
                      Signature-Gericht
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      dish.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {dish.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                {dish.description && (
                  <p className="mt-3 line-clamp-2 text-xs text-[#4A5568]">
                    {dish.description}
                  </p>
                )}
                <div className="mt-4 flex justify-end gap-2 border-t border-[#F5F2E8] pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => edit(dish)}
                    title="Gericht bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Gericht bearbeiten</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Gericht "${dish.name}" wirklich löschen?`)) {
                        deleteMutation.mutate(dish._id);
                      }
                    }}
                    title="Gericht löschen"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="sr-only">Gericht löschen</span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
