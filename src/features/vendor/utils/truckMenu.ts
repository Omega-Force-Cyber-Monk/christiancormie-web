import type { MenuEditorValues } from "../schemas/truckMenu.schema";
export function menuItemBody(values: MenuEditorValues, imageUrl?: string) {
  return {
    name: values.name,
    description: values.description,
    price: Number(values.price),
    isVegetarian: values.isVegetarian,
    isVegan: values.isVegan,
    isGlutenFree: values.isGlutenFree,
    ...(imageUrl ? { imageUrl } : {}),
  };
}
export function menuPrice(value: string | number) {
  const raw = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return "N/A";
  const [whole, fraction = ""] = raw.split(".");
  return `${BigInt(whole).toLocaleString("en-US")}.${fraction.padEnd(2, "0")} (currency unavailable)`;
}
