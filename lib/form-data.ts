import type { AdminRestaurantPayload, DishPayload, RestaurantPayload } from './api';

export const buildDishFormData = (data: DishPayload): FormData => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('price', String(data.price));
  formData.append('description', data.description ?? '');
  formData.append('category', data.category ?? '');
  formData.append('specialtyDescription', data.specialtyDescription ?? '');
  formData.append('ingredients', JSON.stringify(data.ingredients ?? []));
  formData.append('tags', JSON.stringify(data.tags ?? []));
  if (data.leadImageIndex !== undefined) formData.append('leadImageIndex', String(data.leadImageIndex));
  formData.append('preparationProcess', data.preparationProcess ?? '');
  formData.append('isSignatureDish', String(Boolean(data.isSignatureDish)));
  formData.append('isActive', String(data.isActive ?? true));
  formData.append('existingImages', JSON.stringify(data.images ?? []));
  data.imageFiles?.forEach((file) => formData.append('images', file));
  return formData;
};

export const buildRestaurantFormData = (data: RestaurantPayload | AdminRestaurantPayload): FormData => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('shortDescription', data.shortDescription ?? '');
  formData.append('description', data.description);
  formData.append('location', JSON.stringify(data.location));
  if (data.photoCategories) formData.append('photoCategories', JSON.stringify(data.photoCategories));
  formData.append('existingImages', JSON.stringify(data.images ?? []));
  if (data.offers !== undefined) formData.append('offers', JSON.stringify(data.offers));
  for (const key of ['contactEmail', 'contactPhone', 'timeZone', 'opensAt', 'priceRange', 'leadImageIndex', 'showTeamReviews'] as const) {
    if (data[key] !== undefined) formData.append(key, String(data[key]));
  }
  if (data.openingHours) formData.append('openingHours', JSON.stringify(data.openingHours));
  if (data.categories !== undefined) formData.append('categories', JSON.stringify(data.categories));
  else if (data.category !== undefined) formData.append('category', data.category);
  if ('owner' in data) formData.append('owner', JSON.stringify(data.owner));
  data.imageFiles?.forEach((file) => formData.append('images', file));
  if (data.signatureDishes?.length) {
    let offset = data.imageFiles?.length ?? 0;
    formData.append('restaurantImageCount', String(offset));
    const dishes = data.signatureDishes.map(({ imageFiles, ...draft }) => {
      const imageIndexes = imageFiles.map((file) => { formData.append('images', file); return offset++; });
      return { name: draft.name, description: draft.description, price: draft.price, imageIndexes };
    });
    formData.append('signatureDishes', JSON.stringify(dishes));
  }
  return formData;
};
