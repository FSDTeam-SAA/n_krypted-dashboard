"use client";
import {
  OpeningHour,
  RestaurantItem,
  RestaurantPayload,
  SignatureDraft,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export const restaurantDefaults = (
  r?: RestaurantItem | null,
): Partial<RestaurantPayload> => ({
  contactEmail: r?.contactEmail || "",
  contactPhone: r?.contactPhone || "",
  timeZone: r?.timeZone || "Europe/Berlin",
  opensAt: r?.opensAt || "",
  priceRange: r?.priceRange || "$$",
  offers: r?.offers || [],
  showTeamReviews: r?.showTeamReviews !== false,
  openingHours: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map(
    (day) =>
      r?.openingHoursSchedule?.find((h) => h.day === day) || {
        day,
        open: "09:00",
        close: "22:00",
        closed: true,
      },
  ),
  category:
    r?.categories?.length ? r.categories.join(', ') : typeof r?.category === "object"
      ? r.category.categoryName
      : r?.category || "",
});
export function RestaurantDetailsFields({
  value,
  onChange,
}: {
  value: Partial<RestaurantPayload>;
  onChange: (v: Partial<RestaurantPayload>) => void;
}) {
  const { data: session } = useSession();
  const update = (patch: Partial<RestaurantPayload>) =>
    onChange({ ...value, ...patch, ...(patch.category !== undefined ? { categories: patch.category.split(',').map((category) => category.trim()).filter(Boolean) } : {}) });
  const labels: Record<string, string> = {
    Monday: "Montag",
    Tuesday: "Dienstag",
    Wednesday: "Mittwoch",
    Thursday: "Donnerstag",
    Friday: "Freitag",
    Saturday: "Samstag",
    Sunday: "Sonntag",
  };
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <h3 className="font-semibold">Kontakt, Öffnungszeiten & Vorschau</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          E-Mail
          <Input
            type="email"
            value={value.contactEmail || ""}
            onChange={(e) => update({ contactEmail: e.target.value })}
          />
        </label>
        <label>
          Telefon
          <Input
            type="tel"
            value={value.contactPhone || ""}
            onChange={(e) => update({ contactPhone: e.target.value })}
          />
        </label>
        <label>
          Eröffnung (optional)
          <Input
            type="datetime-local"
            value={
              value.opensAt
                ? new Date(
                    new Date(value.opensAt).getTime() -
                      new Date(value.opensAt).getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .slice(0, 16)
                : ""
            }
            onChange={(e) =>
              update({
                opensAt: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : "",
              })
            }
          />
        </label>
        <label>
          Preisklasse
          <select
            className="block w-full rounded border p-2"
            value={value.priceRange}
            onChange={(e) => update({ priceRange: e.target.value })}
          >
            {["$", "$$", "$$$", "$$$$"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Zeitzone
          <Input
            value={value.timeZone || ""}
            onChange={(e) => update({ timeZone: e.target.value })}
          />
        </label>
        <label>
          Küchenart
          <Input
            value={value.category || ""}
            onChange={(e) => update({ category: e.target.value })}
            placeholder="Deutsch, Italienisch, Café …"
          />
        </label>
      </div>
      <div className="space-y-2">
        {value.openingHours?.map((hour: OpeningHour, index: number) => (
          <div
            key={hour.day}
            className="flex flex-wrap items-center gap-3 text-sm"
          >
            <span className="w-24">{labels[hour.day]}</span>
            <label>
              <input
                type="checkbox"
                checked={!hour.closed}
                onChange={(e) =>
                  update({
                    openingHours: value.openingHours?.map((h, i) =>
                      i === index ? { ...h, closed: !e.target.checked } : h,
                    ),
                  })
                }
              />{" "}
              Geöffnet
            </label>
            {(["open", "close"] as const).map((field) => (
              <input
                aria-label={`${labels[hour.day]} ${field}`}
                key={field}
                type="time"
                disabled={hour.closed}
                value={hour[field]}
                onChange={(e) =>
                  update({
                    openingHours: value.openingHours?.map((h, i) =>
                      i === index ? { ...h, [field]: e.target.value } : h,
                    ),
                  })
                }
                className="rounded border p-1"
              />
            ))}
          </div>
        ))}
      </div>
      <label className="block">
        Angebotstexte (eine Zeile pro Angebot)
        <textarea
          className="block min-h-20 w-full rounded border p-2"
          value={value.offers?.join("\n") || ""}
          onChange={(e) => update({ offers: e.target.value.split("\n") })}
        />
      </label>
      {session?.user?.role === 'admin' && <label className="flex gap-2">
        <input
          type="checkbox"
          checked={value.showTeamReviews !== false}
          onChange={(e) => update({ showTeamReviews: e.target.checked })}
        />{" "}
        Bewertungen des Signature Dish Teams anzeigen
      </label>}
    </section>
  );
}
export function SignatureRegistration({
  value,
  onChange,
  disabled = false,
}: {
  value: SignatureDraft[];
  onChange: (v: SignatureDraft[]) => void;
  disabled?: boolean;
}) {
  const update = (index: number, patch: Partial<SignatureDraft>) =>
    onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  return (
    <section className="space-y-4 rounded-2xl border p-5">
      <h3 className="font-semibold">1–3 Signature-Gerichte</h3>
      {value.map((dish, index) => (
        <div key={dish.clientId || index} className="space-y-3 rounded border p-4">
          <label>
            Name
            <Input
              required
              value={dish.name}
              onChange={(e) => update(index, { name: e.target.value })}
            />
          </label>
          <RichTextEditor
            disabled={disabled}
            value={dish.description}
            onChange={(description) => update(index, { description })}
            minHeight={100}
          />
          <label>
            Preis (€)
            <Input
              required
              type="number"
              min="0"
              step=".01"
              value={dish.price}
              onChange={(e) => update(index, { price: Number(e.target.value) })}
            />
          </label>
          <label>
            1–4 Fotos
            <input
              required={!dish.imageFiles.length}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 4 || files.some((file) => !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 20 * 1024 * 1024)) {
                  toast.error('Bitte 1–4 Bilddateien bis jeweils 20 MB auswählen.');
                  e.target.value = '';
                  return;
                }
                update(index, { imageFiles: files });
              }}
            />
            {dish.imageFiles.length > 0 && <span className="block text-xs text-slate-600">{dish.imageFiles.map((file) => file.name).join(', ')}</span>}
          </label>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="text-red-600"
          >
            Gericht entfernen
          </button>
        </div>
      ))}
      {value.length < 3 && (
        <button
          type="button"
          className="rounded border px-4 py-2 text-teal-700"
          onClick={() =>
            onChange([
              ...value,
              { clientId: crypto.randomUUID(), name: "", description: "", price: 0, imageFiles: [] },
            ])
          }
        >
          Signature-Gericht hinzufügen
        </button>
      )}
    </section>
  );
}
