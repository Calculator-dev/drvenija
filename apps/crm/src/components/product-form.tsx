import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PackagePlus, Plus, Trash2 } from "lucide-react";
import { createProduct, getCategories, updateProduct } from "../lib/api";
import { ProductImages } from "./product-images";
import type {
  ProductDetails,
  ProductImage,
  ProductVariant,
} from "../lib/admin-data";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";

const control =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && (
        <span className="block text-xs leading-5 text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}

type VariantDraft = {
  key: string;
  id?: string;
  sku: string;
  dimensions: string;
  price: string;
  priceFrom: string;
  active: boolean;
};
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function variantDrafts(product?: ProductDetails): VariantDraft[] {
  const fromApi = product?.variants?.length
    ? product.variants
    : [
        {
          id: "primary",
          sku: product?.sku ?? "",
          dimensions: product?.dimensions ?? "",
          price: product?.price ?? 0,
          priceFrom: product?.priceFrom ?? null,
          active: true,
          isDefault: true,
        } satisfies ProductVariant,
      ];
  return fromApi.map((variant) => ({
    key: crypto.randomUUID(),
    // The API reports a synthetic "<product>-default" variant for legacy products; only
    // real row IDs are sent back so the server updates them in place.
    id: uuidPattern.test(variant.id) ? variant.id : undefined,
    sku: variant.sku,
    dimensions: variant.dimensions,
    price: String(variant.price),
    priceFrom: variant.priceFrom == null ? "" : String(variant.priceFrom),
    active: variant.active ?? true,
  }));
}

export function ProductForm({
  onCancel,
  onSaved,
  product,
}: {
  product?: ProductDetails;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const cache = useQueryClient();
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const [category, setCategory] = useState(product?.categoryId ?? "");
  const [images, setImages] = useState<ProductImage[]>(product?.media ?? []);
  const initialVariants = variantDrafts(product);
  const [variants, setVariants] = useState<VariantDraft[]>(initialVariants);
  const [mainDimensions, setMainDimensions] = useState(
    product?.dimensions ?? initialVariants[0]?.dimensions ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      product ? updateProduct(product.id, body) : createProduct(body),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["products"] });
      if (product)
        void cache.invalidateQueries({ queryKey: ["product", product.id] });
      void cache.invalidateQueries({ queryKey: ["categories"] });
      void cache.invalidateQueries({ queryKey: ["dashboard"] });
      onSaved();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending || uploading) return;
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const localized = (name: string) => ({
      bs: text(`${name}.bs`),
      en: text(`${name}.en`) || text(`${name}.bs`),
    });
    const translation = (locale: "bs" | "en") =>
      Object.fromEntries(
        ["name", "tagline", "shortDescription", "description"].map((key) => [
          key,
          text(`${key}.${locale}`) ||
            (locale === "en" ? text(`${key}.bs`) : ""),
        ]),
      );
    if (variants.length === 0) return;
    mutation.mutate({
      images: images.map(({ id, alt, isPrimary }) => ({ id, alt, isPrimary })),
      ...(category === "new"
        ? { newCategory: localized("category") }
        : { categoryId: category }),
      type: text("type"),
      material: text("material"),
      variants: variants.map((variant, index) => ({
        ...(variant.id ? { id: variant.id } : {}),
        sku: variant.sku.trim(),
        dimensions: (index === 0 ? mainDimensions : variant.dimensions).trim(),
        price: Number(variant.price),
        priceFrom:
          variant.priceFrom.trim() === "" ? null : Number(variant.priceFrom),
        active: variant.active,
      })),
      leadTime: localized("leadTime"),
      stockLabel: localized("stockLabel"),
      featured: data.has("featured"),
      customizable: data.has("customizable"),
      translations: { bs: translation("bs"), en: translation("en") },
    });
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        sku: "",
        dimensions: "",
        price: "",
        priceFrom: "",
        active: true,
      },
    ]);
  }
  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, ...patch } : variant,
      ),
    );
  }
  function removeVariant(index: number) {
    setVariants((current) =>
      current.length <= 1
        ? current
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-6">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={mutation.isPending || uploading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Nazad na proizvode
      </Button>
      <div className="mb-8 mt-6">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Katalog
        </p>
        <h2 className="mt-2 font-serif text-4xl">
          {product ? "Uredi proizvod" : "Dodaj proizvod"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Opišite proizvod, odaberite kategoriju i postavite cijenu. Polja
          označena zvjezdicom (*) su obavezna.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <ProductImages
          images={images}
          onChange={setImages}
          onBusy={setUploading}
          disabled={mutation.isPending}
        />
        <fieldset
          disabled={mutation.isPending || uploading}
          className="grid min-w-0 gap-6 lg:grid-cols-[1fr_300px]"
        >
          <div className="space-y-6">
            <Card className="space-y-5 p-6">
              <h3 className="font-serif text-2xl">Detalji proizvoda</h3>
              <Field label="Naziv proizvoda na bosanskom *">
                <Input
                  name="name.bs"
                  defaultValue={product?.translations.bs?.name ?? ""}
                  required
                  maxLength={200}
                  placeholder="npr. Monogram za vjenčanje"
                />
              </Field>
              <Field label="Kratki slogan">
                <Input
                  name="tagline.bs"
                  defaultValue={product?.translations.bs?.tagline ?? ""}
                  maxLength={300}
                  placeholder="Kratka rečenica koja opisuje proizvod"
                />
              </Field>
              <Field label="Kratki opis">
                <textarea
                  name="shortDescription.bs"
                  defaultValue={
                    product?.translations.bs?.shortDescription ?? ""
                  }
                  className={control}
                  rows={2}
                  maxLength={1000}
                />
              </Field>
              <Field label="Opis na bosanskom *">
                <textarea
                  name="description.bs"
                  defaultValue={product?.translations.bs?.description ?? ""}
                  className={control}
                  rows={5}
                  required
                  maxLength={10000}
                />
              </Field>
              <Field
                label="Glavne dimenzije *"
                hint="Prikazuju se kao osnovne dimenzije proizvoda i koriste se za prvu varijantu."
              >
                <Input
                  required
                  maxLength={200}
                  placeholder="npr. 30 × 30 cm"
                  value={mainDimensions}
                  onChange={(event) => setMainDimensions(event.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rok izrade na bosanskom *">
                  <Input
                    name="leadTime.bs"
                    defaultValue={product?.leadTime.bs ?? ""}
                    required
                    maxLength={200}
                    placeholder="3 do 5 radnih dana"
                  />
                </Field>
                <Field label="Dostupnost na bosanskom *">
                  <Input
                    name="stockLabel.bs"
                    required
                    maxLength={200}
                    defaultValue={product?.stockLabel.bs ?? "Po narudžbi"}
                  />
                </Field>
              </div>
            </Card>
            <Card className="p-6">
              <details>
                <summary className="cursor-pointer font-serif text-2xl">
                  Sadržaj na engleskom{" "}
                  <span className="ml-2 font-sans text-xs text-muted-foreground">
                    Opcionalno
                  </span>
                </summary>
                <p className="my-4 text-sm text-muted-foreground">
                  Ostavite polje prazno kako bi se koristio tekst na bosanskom.
                </p>
                <div className="space-y-4">
                  <Field label="Naziv proizvoda na engleskom">
                    <Input
                      name="name.en"
                      defaultValue={product?.translations.en?.name ?? ""}
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Kratki slogan na engleskom">
                    <Input
                      name="tagline.en"
                      defaultValue={product?.translations.en?.tagline ?? ""}
                      maxLength={300}
                    />
                  </Field>
                  <Field label="Kratki opis na engleskom">
                    <textarea
                      name="shortDescription.en"
                      defaultValue={
                        product?.translations.en?.shortDescription ?? ""
                      }
                      className={control}
                      rows={2}
                      maxLength={1000}
                    />
                  </Field>
                  <Field label="Opis na engleskom">
                    <textarea
                      name="description.en"
                      defaultValue={product?.translations.en?.description ?? ""}
                      className={control}
                      rows={4}
                      maxLength={10000}
                    />
                  </Field>
                  <Field label="Rok izrade na engleskom">
                    <Input
                      name="leadTime.en"
                      defaultValue={product?.leadTime.en ?? ""}
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Dostupnost na engleskom">
                    <Input
                      name="stockLabel.en"
                      defaultValue={product?.stockLabel.en ?? ""}
                      maxLength={200}
                    />
                  </Field>
                </div>
              </details>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="space-y-5 p-6">
              <h3 className="font-serif text-2xl">Organizacija</h3>
              <Field label="Kategorija *">
                <select
                  className={control}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                >
                  <option value="">
                    {categories.isPending
                      ? "Učitavanje kategorija…"
                      : "Odaberite kategoriju"}
                  </option>
                  {categories.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.translations.bs?.name ??
                        item.translations.en?.name ??
                        item.id}
                    </option>
                  ))}
                  <option value="new">+ Kreiraj kategoriju</option>
                </select>
              </Field>
              {categories.isError && (
                <div role="alert" className="space-y-2 text-sm">
                  <p>Kategorije nije moguće učitati.</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void categories.refetch()}
                  >
                    Pokušaj ponovo
                  </Button>
                </div>
              )}
              {categories.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Još nema kategorija. Odaberite „Kreiraj kategoriju“ kako biste
                  dodali prvu.
                </p>
              )}
              {category === "new" && (
                <div className="space-y-4 border-l-2 border-primary/30 pl-4">
                  <Field label="Naziv kategorije na bosanskom *">
                    <Input name="category.bs" required maxLength={200} />
                  </Field>
                  <Field label="Naziv kategorije na engleskom">
                    <Input name="category.en" maxLength={200} />
                  </Field>
                </div>
              )}
              <Field label="Tip proizvoda *">
                <select
                  name="type"
                  className={control}
                  defaultValue={product?.type ?? "standard"}
                >
                  <option value="standard">Standardni</option>
                  <option value="custom">Personalizirani</option>
                </select>
              </Field>
              <Field label="Materijal *">
                <select
                  name="material"
                  className={control}
                  defaultValue={product?.material ?? "plexiglass"}
                >
                  <option value="plexiglass">Pleksiglas</option>
                  <option value="mediapan">MDF / Mediapan</option>
                  <option value="mixed">Kombinovani materijali</option>
                </select>
              </Field>
            </Card>
            <Card className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-2xl">Varijante i cijene</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Prva varijanta je osnovna i koristi se kao glavna cijena
                    proizvoda i glavne dimenzije.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={addVariant}>
                  <Plus className="mr-2 h-4 w-4" />
                  Dodaj varijantu
                </Button>
              </div>
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    key={variant.key}
                    className="space-y-4 rounded-lg border border-border/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        Varijanta {index + 1}
                        {index === 0 ? " (osnovna)" : ""}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={variants.length <= 1}
                        onClick={() => removeVariant(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Ukloni
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="SKU *" hint="Jedinstvena šifra varijante.">
                        <Input
                          required
                          maxLength={80}
                          pattern="[A-Za-z0-9_-]+"
                          placeholder="DRV-MONO-01-30"
                          value={variant.sku}
                          onChange={(event) =>
                            updateVariant(index, { sku: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Dimenzije *">
                        <Input
                          required
                          maxLength={200}
                          placeholder="npr. 30 × 30 cm"
                          value={index === 0 ? mainDimensions : variant.dimensions}
                          readOnly={index === 0}
                          onChange={
                            index === 0
                              ? undefined
                              : (event) =>
                                  updateVariant(index, {
                                    dimensions: event.target.value,
                                  })
                          }
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Cijena (BAM) *">
                        <Input
                          required
                          type="number"
                          min={0}
                          max={1000000}
                          step={1}
                          placeholder="45"
                          value={variant.price}
                          onChange={(event) =>
                            updateVariant(index, { price: event.target.value })
                          }
                        />
                      </Field>
                      <Field
                        label="Početna cijena (BAM)"
                        hint="Opcionalno, za prikaz cijene od određenog iznosa."
                      >
                        <Input
                          type="number"
                          min={0}
                          max={1000000}
                          step={1}
                          placeholder="45"
                          value={variant.priceFrom}
                          onChange={(event) =>
                            updateVariant(index, {
                              priceFrom: event.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={variant.active}
                        onChange={(event) =>
                          updateVariant(index, { active: event.target.checked })
                        }
                        className="h-4 w-4 accent-primary"
                      />
                      Aktivna varijanta
                    </label>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="space-y-4 p-6">
              <h3 className="font-serif text-2xl">Opcije</h3>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={product?.featured ?? false}
                  className="h-4 w-4 accent-primary"
                />
                Istaknuti proizvod
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="customizable"
                  defaultChecked={product?.customizable ?? false}
                  className="h-4 w-4 accent-primary"
                />
                Dozvoli personalizaciju
              </label>
            </Card>
          </div>
        </fieldset>
        {mutation.isError && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {mutation.error.message}
          </p>
        )}
        <div className="flex items-center justify-end gap-3 border-t pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending || uploading}
          >
            Odustani
          </Button>
          <Button type="submit" disabled={mutation.isPending || uploading}>
            <PackagePlus className="mr-2 h-4 w-4" />
            {mutation.isPending
              ? "Čuvanje proizvoda…"
              : product
                ? "Sačuvaj izmjene"
                : "Sačuvaj proizvod"}
          </Button>
        </div>
      </form>
    </div>
  );
}
