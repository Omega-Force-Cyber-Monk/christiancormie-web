import { truckId, cuisineId } from "./truckSettings.test-fixtures.mjs";
export const menuId = "22222222-2222-4222-8222-222222222222";
export const categoryId = "33333333-3333-4333-8333-333333333333";
export const itemId = "44444444-4444-4444-8444-444444444444";
export const itemDto = (overrides = {}) => ({
  id: itemId,
  categoryId,
  name: "Backend Menu Item",
  description: "Actual description",
  imageUrl: null,
  price: "19.99",
  status: "AVAILABLE",
  isVegetarian: true,
  isVegan: false,
  isGlutenFree: true,
  sortOrder: 0,
  ...overrides,
});
export const categoryDto = (overrides = {}) => ({
  id: categoryId,
  menuId,
  name: "Actual Category",
  description: null,
  sortOrder: 0,
  items: [itemDto()],
  ...overrides,
});
export const menuDto = (overrides = {}) => ({
  id: menuId,
  foodTruckId: truckId,
  name: "Actual Menu",
  description: null,
  isActive: true,
  categories: [categoryDto()],
  ...overrides,
});
export const itemBody = {
  name: "Backend Menu Item",
  description: "Actual description",
  price: 19.99,
  isVegetarian: true,
  isVegan: false,
  isGlutenFree: true,
};
export { truckId, cuisineId };
