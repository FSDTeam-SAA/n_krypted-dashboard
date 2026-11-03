"use client";
import { FormEvent, ReactNode, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Tags,
  TicketPercent,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import {
  api,
  AppSettings,
  CatalogEntry,
  featureApi,
  getApiErrorMessage,
  PromotionItem,
  restaurantApi,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "cities", label: "Städte", icon: MapPin },
  { key: "tags", label: "Labels", icon: Tags },
  { key: "promotions", label: "Angebote", icon: TicketPercent },
  { key: "safety", label: "Gesundheit & Sicherheit", icon: ShieldCheck },
  { key: "team", label: "Team-Bewertungen", icon: Star },
  { key: "settings", label: "Kontakt & Social Media", icon: MessageSquareText },
] as const;
const cardClass = "min-w-0 rounded-3xl border border-[#F0ECE1] bg-white p-5 shadow-xs sm:p-6";
const inputClass = "h-11 border-[#E2E8F0] focus-visible:border-[#0097A7]";
const selectClass = "h-11 w-full min-w-0 appearance-none rounded-xl border border-[#E2E8F0] bg-white py-2 pl-3 pr-10 text-sm text-[#1E1E1E] transition-colors focus:border-[#0097A7] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/15 disabled:cursor-not-allowed disabled:opacity-50";
const textareaClass = "block min-h-32 w-full resize-y rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm font-normal leading-relaxed text-[#1E1E1E] placeholder:text-[#94A3B8] focus:border-[#0097A7] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/15";
const checkboxClass = "mt-0.5 h-4 w-4 shrink-0 accent-[#0097A7]";

function Field({ label, children, className }: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-2 text-sm font-medium text-[#334155]", className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 border-b border-[#F0ECE1] pb-5">
      <h2 className="text-base font-semibold text-[#1E1E1E]">{title}</h2>
      <p className="text-sm leading-relaxed text-[#718096]">{description}</p>
    </div>
  );
}

function SelectField({ children }: { children: ReactNode }) {
  return (
    <span className="relative block min-w-0">
      {children}
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" />
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#DCE5E7] bg-[#F8FBFB] px-5 py-10 text-center text-sm leading-relaxed text-[#718096]">
      <UtensilsCrossed aria-hidden="true" className="h-7 w-7 text-[#0097A7]/60" />
      <p>{children}</p>
    </div>
  );
}

function SaveButton({ busy, children = "Änderungen speichern" }: { busy: boolean; children?: ReactNode }) {
  return (
    <Button type="submit" disabled={busy} className="w-full gap-2 sm:w-auto">
      {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
      {busy ? "Wird gespeichert …" : children}
    </Button>
  );
}

const blankPromotion = {
  title: "",
  text: "",
  restaurant: "",
  dish: "",
  bannerUrl: "",
  discountType: "none" as PromotionItem["discountType"],
  discountValue: 0,
  startsAt: "",
  endsAt: "",
  active: true,
};
export default function ContentManagement() {
  const cache = useQueryClient();
  const [tab, setTab] = useState("cities");
  const [busy, setBusy] = useState(false);
  const [entryId, setEntryId] = useState<string>();
  const [entry, setEntry] = useState({ name: "", country: "", active: true });
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [promotionId, setPromotionId] = useState<string>();
  const [promotion, setPromotion] = useState(blankPromotion);
  const [restaurantId, setRestaurantId] = useState("");
  const [safety, setSafety] = useState({
    healthNotice: "",
    safetyComment: "",
    safetyDisclaimer: "",
  });
  const [review, setReview] = useState({
    comment: "",
    rating: 5,
    dishId: "",
    status: "active",
  });
  const entries = useQuery({
    queryKey: ["catalog"],
    queryFn: featureApi.entries,
  });
  const publicSettings = useQuery({
    queryKey: ["app-settings"],
    queryFn: featureApi.settings,
  });
  const promotions = useQuery({
    queryKey: ["promotions"],
    queryFn: featureApi.promotions,
  });
  const restaurants = useQuery({
    queryKey: ["content-restaurants"],
    queryFn: async () => {
      const all = [];
      let page = 1;
      while (true) {
        const result = await restaurantApi.getAllRestaurants({
          page: page++,
          limit: 100,
        });
        all.push(...result.data);
        if (page > result.meta.totalPages) return all;
      }
    },
  });
  const currentSettings = settings || publicSettings.data;
  const selected = restaurants.data?.find((r) => r._id === restaurantId);
  const run = async (action: () => Promise<unknown>, key: string) => {
    setBusy(true);
    try {
      await action();
      await cache.invalidateQueries({ queryKey: [key] });
      toast.success("Gespeichert.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Speichern fehlgeschlagen."));
    } finally {
      setBusy(false);
    }
  };
  const chooseRestaurant = (id: string) => {
    setRestaurantId(id);
    const r = restaurants.data?.find((item) => item._id === id);
    setSafety({
      healthNotice: r?.healthNotice || "",
      safetyComment: r?.safetyComment || "",
      safetyDisclaimer: r?.safetyDisclaimer || "",
    });
    setReview({ comment: "", rating: 5, dishId: "", status: "active" });
  };
  const restaurantSelect = (value: string, change: (id: string) => void) => (
    <Field label="Restaurant">
      <SelectField>
        <select required className={selectClass} value={value} onChange={(e) => change(e.target.value)}>
          <option value="">Restaurant auswählen</option>
          {restaurants.data?.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
        </select>
      </SelectField>
    </Field>
  );
  const kind = tab === "cities" ? "city" : "tag";
  const submitEntry = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await featureApi.saveEntry({ ...entry, kind }, entryId);
      setEntryId(undefined);
      setEntry({ name: "", country: "", active: true });
    }, "catalog");
  };
  const resetEntry = () => {
    setEntryId(undefined);
    setEntry({ name: "", country: "", active: true });
  };
  const error =
    entries.error ||
    publicSettings.error ||
    restaurants.error ||
    promotions.error;
  return (
    <fieldset disabled={busy} aria-busy={busy} className="mx-auto min-w-0 max-w-6xl space-y-6 border-0 p-0">
      <header className={cn(cardClass, "space-y-6")}>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-[#1E1E1E] sm:text-2xl">Inhalte & Angebote</h1>
          <p className="text-sm leading-relaxed text-[#718096]">Verwalten Sie App-Inhalte, Angebote und öffentliche Informationen.</p>
        </div>
        <nav aria-label="Inhaltsbereiche" className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F7F9FA] p-2 sm:grid-cols-3">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => { setTab(key); resetEntry(); }}
              className={cn("flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7] sm:text-sm", tab === key ? "bg-[#0097A7] text-white shadow-sm" : "text-[#64748B] hover:bg-white hover:text-[#0097A7]")}
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /><span>{label}</span>
            </button>
          ))}
        </nav>
      </header>
      {(entries.isLoading || publicSettings.isLoading || restaurants.isLoading || promotions.isLoading) && <p role="status" className="flex items-center gap-2 px-1 text-sm text-[#718096]"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-[#0097A7]" />Inhalte werden geladen …</p>}
      {error && (
        <p
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {getApiErrorMessage(error, "Inhalte konnten nicht geladen werden.")}{" "}
          <button
            type="button"
            className="font-semibold underline underline-offset-4"
            onClick={() => {
              void cache.invalidateQueries();
            }}
          >
            Erneut versuchen
          </button>
        </p>
      )}
      {(tab === "cities" || tab === "tags") && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form
            onSubmit={submitEntry}
            className={cn(cardClass, "space-y-5")}
          >
            <SectionHeading title={entryId ? "Eintrag bearbeiten" : tab === "cities" ? "Stadt hinzufügen" : "Label hinzufügen"} description={tab === "cities" ? "Legen Sie die Städte für die Restaurantsuche fest." : "Verwalten Sie Kennzeichnungen für Gerichte und Restaurants."} />
            <Field label="Name">
              <Input
                className={inputClass}
                placeholder={tab === "cities" ? "z. B. München" : "z. B. Vegan"}
                required
                maxLength={120}
                value={entry.name}
                onChange={(e) => setEntry({ ...entry, name: e.target.value })}
              />
            </Field>
            {tab === "cities" && (
              <Field label="Land">
                <Input
                  className={inputClass}
                  placeholder="z. B. Deutschland"
                  value={entry.country}
                  onChange={(e) =>
                    setEntry({ ...entry, country: e.target.value })
                  }
                />
              </Field>
            )}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E7EFEF] bg-[#F8FBFB] p-4 text-sm text-[#334155]">
              <input
                className={checkboxClass}
                type="checkbox"
                checked={entry.active}
                onChange={(e) =>
                  setEntry({ ...entry, active: e.target.checked })
                }
              />{" "}
              <span><span className="block font-medium">In der App verfügbar</span><span className="mt-1 block text-xs text-[#718096]">Nur aktive Einträge können ausgewählt werden.</span></span>
            </label>
            <div className="flex flex-col-reverse gap-3 border-t border-[#F0ECE1] pt-5 sm:flex-row sm:justify-end">
              {entryId && (
                <Button type="button" variant="outline" onClick={resetEntry}>
                  Abbrechen
                </Button>
              )}
              <SaveButton busy={busy}>Eintrag speichern</SaveButton>
            </div>
          </form>
          <div className={cn(cardClass, "space-y-4")}>
            <div className="flex items-center justify-between gap-3 border-b border-[#F0ECE1] pb-4"><h2 className="text-base font-semibold">{tab === "cities" ? "Alle Städte" : "Alle Labels"}</h2><span className="rounded-full bg-[#E0F2F1] px-3 py-1 text-xs font-semibold text-[#00796B]">{entries.data?.filter((e) => e.kind === kind).length ?? 0}</span></div>
            {entries.data
              ?.filter((e) => e.kind === kind)
              .map((item: CatalogEntry) => (
                <button
                  type="button"
                  key={item._id}
                  className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7]", entryId === item._id ? "border-[#0097A7] bg-[#F0FAFA]" : "border-[#EDF0F2] hover:border-[#B2DFDB] hover:bg-[#F8FBFB]")}
                  onClick={() => {
                    setEntryId(item._id);
                    setEntry({
                      name: item.name,
                      country: item.country,
                      active: item.active,
                    });
                  }}
                >
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold text-[#334155]">{item.name}</span>
                    {item.country && <span className="mt-1 block text-xs text-[#718096]">{item.country}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", item.active ? "bg-[#EAF8F0] text-[#218653]" : "bg-[#FFF3E8] text-[#B96920]")}>{item.active ? "Aktiv" : "Inaktiv"}</span><Pencil aria-label="Bearbeiten" className="h-4 w-4 text-[#0097A7]" /></span>
                </button>
              ))}
            {entries.data?.filter((e) => e.kind === kind).length === 0 && (
              <EmptyState>Noch keine Einträge. Fügen Sie eine Stadt oder ein Label hinzu.</EmptyState>
            )}
          </div>
        </div>
      )}
      {tab === "settings" && currentSettings && (
        <form
          className={cn(cardClass, "space-y-6")}
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () => featureApi.saveSettings(currentSettings),
              "app-settings",
            );
          }}
        >
          <SectionHeading title="Kontakt & Social Media" description="Diese Kontaktdaten und Social-Media-Links werden in der App angezeigt." />
          <div className="grid gap-5 sm:grid-cols-2">
            {Object.entries({
              contactEmail: "Kontakt-E-Mail",
              contactPhone: "Telefon",
              contactAddress: "Anschrift",
              instagramUrl: "Instagram URL",
              tiktokUrl: "TikTok URL",
            }).map(([field, label]) => (
              <Field label={label} className={field === "contactAddress" ? "sm:col-span-2" : undefined} key={field}>
                <Input
                  className={inputClass}
                  type={
                    field === "contactEmail"
                      ? "email"
                      : field.endsWith("Url")
                        ? "url"
                        : field === "contactPhone" ? "tel" : "text"
                  }
                  value={currentSettings[field as keyof AppSettings] as string}
                  onChange={(e) =>
                    setSettings({ ...currentSettings, [field]: e.target.value })
                  }
                />
              </Field>
            ))}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E7EFEF] bg-[#F8FBFB] p-4 text-sm text-[#334155]">
            <input
              className={checkboxClass}
              type="checkbox"
              checked={currentSettings.showTeamReviews}
              onChange={(e) =>
                setSettings({
                  ...currentSettings,
                  showTeamReviews: e.target.checked,
                })
              }
            />{" "}
            <span><span className="block font-semibold">Team-Bewertungen in der App anzeigen</span><span className="mt-1 block text-xs leading-relaxed text-[#718096]">Steuert die Sichtbarkeit der Team-Bewertungen für die gesamte App.</span></span>
          </label>
          <div className="flex justify-end border-t border-[#F0ECE1] pt-5"><SaveButton busy={busy} /></div>
        </form>
      )}
      {(tab === "safety" || tab === "team") && (
        <section className={cn(cardClass, "space-y-6")}>
          <SectionHeading title={tab === "team" ? "Team-Bewertungen" : "Gesundheit & Sicherheit"} description={tab === "team" ? "Veröffentlichen Sie eine Bewertung mit dem offiziellen Signature Dish Team-Badge." : "Pflegen Sie Gesundheitshinweise, Kommentare und Haftungshinweise für jedes Restaurant."} />
          <div className="max-w-xl">{restaurantSelect(restaurantId, chooseRestaurant)}</div>
          {!selected && <EmptyState>{restaurants.isLoading ? "Restaurants werden geladen …" : "Wählen Sie ein Restaurant aus, um die Inhalte zu verwalten."}</EmptyState>}
          {selected && tab === 'team' && <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#D9EDED] bg-[#F0FAFA] p-4 text-sm text-[#334155]"><input className={checkboxClass} type="checkbox" disabled={busy} checked={selected.showTeamReviews !== false} onChange={(e) => void run(() => api.put(`/admin/restaurants/${restaurantId}`, { showTeamReviews: e.target.checked }), 'content-restaurants')} /><span><span className="block font-semibold">Team-Bewertungen für dieses Restaurant anzeigen</span><span className="mt-1 block text-xs leading-relaxed text-[#718096]">Änderungen an dieser Einstellung werden sofort gespeichert.</span></span></label>}
          {selected &&
            (tab === "safety" ? (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(
                    () =>
                      api.put(
                        `/admin/restaurants/${restaurantId}/safety`,
                        safety,
                      ),
                    "content-restaurants",
                  );
                }}
              >
                {Object.entries({
                  healthNotice: "Gesundheitshinweis",
                  safetyComment: "Kommentar der Administration",
                  safetyDisclaimer: "Haftungshinweis",
                }).map(([key, label]) => (
                  <div key={key} className="min-w-0 space-y-2">
                    <h3 className="text-sm font-medium text-[#334155]">{label}</h3>
                    <RichTextEditor
                      disabled={busy}
                      value={safety[key as keyof typeof safety]}
                      onChange={(html) => setSafety({ ...safety, [key]: html })}
                      minHeight={100}
                    />
                  </div>
                ))}
                <div className="flex justify-end border-t border-[#F0ECE1] pt-5"><SaveButton busy={busy} /></div>
              </form>
            ) : (
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await featureApi.teamReview({
                      ...review,
                      dishId: review.dishId || undefined,
                      restaurantId,
                    });
                    setReview({ ...review, comment: "" });
                  }, "restaurant-review-list");
                }}
              >
                <div className="grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Field label="Bewertung für">
                    <SelectField>
                      <select
                        className={selectClass}
                        value={review.dishId}
                        onChange={(e) =>
                          setReview({ ...review, dishId: e.target.value })
                        }
                      >
                        <option value="">Restaurant allgemein</option>
                        {selected.dishes.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </SelectField>
                  </Field>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-[#334155]">Sterne</span>
                    <div role="group" aria-label="Sternebewertung" className="flex h-11 items-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${rating} ${rating === 1 ? "Stern" : "Sterne"}`} aria-pressed={review.rating === rating} onClick={() => setReview({ ...review, rating })} className="rounded-lg p-1.5 transition-colors hover:bg-[#FFF8DF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7]"><Star aria-hidden="true" className={cn("h-6 w-6", rating <= review.rating ? "fill-[#F5BC35] text-[#F5BC35]" : "text-[#CBD5E1]")} /></button>)}
                      <span className="ml-2 text-sm font-semibold text-[#64748B]">{review.rating}/5</span>
                    </div>
                  </div>
                </div>
                <Field label="Bewertung des Teams">
                  <textarea
                    required
                    maxLength={4000}
                    className={textareaClass}
                    placeholder="Teilen Sie die Eindrücke des Signature Dish Teams …"
                    rows={5}
                    value={review.comment}
                    onChange={(e) =>
                      setReview({ ...review, comment: e.target.value })
                    }
                  />
                </Field>
                <div className="flex flex-col gap-4 border-t border-[#F0ECE1] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-[#334155]">
                    <input
                      className={checkboxClass}
                      type="checkbox"
                      checked={review.status === "active"}
                      onChange={(e) =>
                        setReview({
                          ...review,
                          status: e.target.checked ? "active" : "hidden",
                        })
                      }
                    />{" "}
                    <span><span className="block font-medium">Bewertung veröffentlichen</span><span className="mt-1 block text-xs text-[#718096]">Mit Team-Badge in der App sichtbar.</span></span>
                  </label>
                  <SaveButton busy={busy}>Team-Bewertung speichern</SaveButton>
                </div>
              </form>
            ))}
        </section>
      )}
      {tab === "promotions" && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <form
            className={cn(cardClass, "space-y-5")}
            onSubmit={(e) => {
              e.preventDefault();
              const start = new Date(promotion.startsAt);
              const end = new Date(promotion.endsAt);
              if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
                toast.error('Das Ende muss nach dem Beginn liegen.');
                return;
              }
              void run(async () => {
                await featureApi.savePromotion(
                  {
                    ...promotion,
                    dish: promotion.dish || null,
                    startsAt: start.toISOString(),
                    endsAt: end.toISOString(),
                  },
                  promotionId,
                );
                setPromotion(blankPromotion);
                setPromotionId(undefined);
              }, "promotions");
            }}
          >
            <SectionHeading title={promotionId ? "Angebot bearbeiten" : "Angebot erstellen"} description="Planen Sie zeitlich begrenzte Aktionen für Restaurants oder einzelne Gerichte." />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {restaurantSelect(promotion.restaurant, (restaurant) =>
                setPromotion({ ...promotion, restaurant, dish: "" }),
              )}
              <Field label="Gericht (optional)">
                <SelectField>
                  <select
                    className={selectClass}
                    value={promotion.dish}
                    onChange={(e) =>
                      setPromotion({ ...promotion, dish: e.target.value })
                    }
                  >
                    <option value="">Alle Gerichte / Restaurant</option>
                    {restaurants.data
                      ?.find((r) => r._id === promotion.restaurant)
                      ?.dishes.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </SelectField>
              </Field>
            </div>
            <Field label="Titel">
              <Input
                className={inputClass}
                placeholder="z. B. 20 % auf unser Signature Dish"
                required
                maxLength={160}
                value={promotion.title}
                onChange={(e) =>
                  setPromotion({ ...promotion, title: e.target.value })
                }
              />
            </Field>
            <Field label="Beschreibung">
              <textarea
                maxLength={2000}
                className={textareaClass}
                placeholder="Beschreiben Sie das Angebot und seine Bedingungen …"
                value={promotion.text}
                onChange={(e) =>
                  setPromotion({ ...promotion, text: e.target.value })
                }
              />
            </Field>
            <Field label="Banner-URL (optional)">
              <Input
                className={inputClass}
                placeholder="https://…"
                type="url"
                value={promotion.bannerUrl}
                onChange={(e) =>
                  setPromotion({ ...promotion, bannerUrl: e.target.value })
                }
              />
            </Field>
            <Field label="Oder Banner hochladen">
              <span className="flex min-w-0 flex-col gap-3 rounded-2xl border border-dashed border-[#B8D8DB] bg-[#F8FBFB] p-4">
                <span className="flex items-center gap-3"><span className="rounded-xl bg-[#E0F2F1] p-2.5 text-[#0097A7]"><ImagePlus aria-hidden="true" className="h-5 w-5" /></span><span><span className="block text-sm font-medium text-[#334155]">Bannerbild auswählen</span><span className="mt-0.5 block text-xs font-normal text-[#718096]">JPG, PNG, WebP oder AVIF · Max. 20 MB</span></span></span>
                <input
                  className="block w-full min-w-0 text-xs font-normal text-[#718096] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#E0F2F1] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#00796B]"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 20 * 1024 * 1024)) { toast.error('Bitte eine Bilddatei bis 20 MB auswählen.'); e.target.value = ''; return; }
                    if (file)
                      void run(async () => {
                        const form = new FormData();
                        form.append("image", file);
                        const result = await api.post(
                          "/admin/promotions/banner",
                          form,
                          { headers: { "Content-Type": "multipart/form-data" } },
                        );
                        setPromotion((p) => ({
                          ...p,
                          bannerUrl: result.data.data.secure_url,
                        }));
                      }, "promotions");
                  }}
                />
              </span>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Rabattart">
                <SelectField>
                  <select
                    className={selectClass}
                    value={promotion.discountType}
                    onChange={(e) =>
                      setPromotion({
                        ...promotion,
                        discountType: e.target.value as PromotionItem["discountType"],
                      })
                    }
                  >
                    <option value="none">Kein Rabatt</option>
                    <option value="percent">Prozent (%)</option>
                    <option value="amount">Betrag (€)</option>
                  </select>
                </SelectField>
              </Field>
              <Field label={promotion.discountType === "percent" ? "Rabatt (%)" : "Rabatt (€)"}>
                <Input
                  className={inputClass}
                  aria-label="Rabattwert"
                  disabled={promotion.discountType === "none" || busy}
                  type="number"
                  min="0"
                  max={promotion.discountType === "percent" ? 100 : undefined}
                  step=".01"
                  value={promotion.discountValue}
                  onChange={(e) =>
                    setPromotion({
                      ...promotion,
                      discountValue: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {(["startsAt", "endsAt"] as const).map((key) => (
                <Field label={key === "startsAt" ? "Beginn" : "Ende"} key={key}>
                  <Input
                    className={cn(inputClass, "min-w-0")}
                    required
                    type="datetime-local"
                    min={key === 'endsAt' ? promotion.startsAt : undefined}
                    value={promotion[key]}
                    onChange={(e) =>
                      setPromotion({ ...promotion, [key]: e.target.value })
                    }
                  />
                </Field>
              ))}
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E7EFEF] bg-[#F8FBFB] p-4 text-sm text-[#334155]">
              <input
                className={checkboxClass}
                type="checkbox"
                checked={promotion.active}
                onChange={(e) =>
                  setPromotion({ ...promotion, active: e.target.checked })
                }
              />{" "}
              <span><span className="block font-medium">Angebot aktivieren</span><span className="mt-1 block text-xs leading-relaxed text-[#718096]">Wird innerhalb des gewählten Zeitraums in der App angezeigt.</span></span>
            </label>
            <div className="flex flex-col-reverse gap-3 border-t border-[#F0ECE1] pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPromotionId(undefined);
                  setPromotion(blankPromotion);
                }}
              >
                Zurücksetzen
              </Button>
              <SaveButton busy={busy}>Angebot speichern</SaveButton>
            </div>
          </form>
          <div className={cn(cardClass, "space-y-4")}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0ECE1] pb-4"><div className="flex items-center gap-2"><h2 className="text-base font-semibold">Alle Angebote</h2><span className="rounded-full bg-[#E0F2F1] px-2.5 py-1 text-xs font-semibold text-[#00796B]">{promotions.data?.length ?? 0}</span></div><Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => { setPromotionId(undefined); setPromotion(blankPromotion); }}><Plus aria-hidden="true" className="h-4 w-4" />Neu</Button></div>
            {promotions.data?.length === 0 && <EmptyState>Noch keine Angebote. Erstellen Sie Ihre erste Aktion.</EmptyState>}
            {promotions.data?.map((p) => {
              const status = !p.active ? "Inaktiv" : new Date(p.endsAt) <= new Date() ? "Abgelaufen" : new Date(p.startsAt) > new Date() ? "Geplant" : "Aktiv";
              return (
                <button
                  type="button"
                  key={p._id}
                  aria-pressed={promotionId === p._id}
                  className={cn("block w-full space-y-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7]", promotionId === p._id ? "border-[#0097A7] bg-[#F0FAFA]" : "border-[#EDF0F2] hover:border-[#B2DFDB] hover:bg-[#F8FBFB]")}
                  onClick={() => {
                    setPromotionId(p._id);
                    const local = (v: string) => {
                      const d = new Date(v);
                      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                    };
                    setPromotion({
                      ...p,
                      restaurant: p.restaurant?._id || "",
                      dish: p.dish?._id || "",
                      startsAt: local(p.startsAt),
                      endsAt: local(p.endsAt),
                    });
                  }}
                >
                  <span className="flex items-start justify-between gap-3"><strong className="min-w-0 break-words text-sm leading-relaxed text-[#334155]">{p.title}</strong><span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", status === "Aktiv" ? "bg-[#EAF8F0] text-[#218653]" : status === "Geplant" ? "bg-[#EAF2FD] text-[#427AB4]" : "bg-[#F1F3F5] text-[#718096]")}>{status}</span></span>
                  <span className="block text-xs text-[#718096]">{p.restaurant?.name || "Restaurant"}{p.dish?.name ? ` · ${p.dish.name}` : ""}</span>
                  <span className="block text-xs leading-relaxed text-[#718096]">{new Date(p.startsAt).toLocaleDateString("de-DE")} – {new Date(p.endsAt).toLocaleDateString("de-DE")}</span>
                  <span className="flex items-center justify-between border-t border-[#E7EFEF] pt-3 text-xs font-semibold text-[#0097A7]"><span className="flex items-center gap-1.5"><Pencil aria-hidden="true" className="h-3.5 w-3.5" />Angebot bearbeiten</span><ChevronRight aria-hidden="true" className="h-4 w-4" /></span>
                </button>
              );            
})}
          </div>
        </div>
      )}
    </fieldset>
  );
}
