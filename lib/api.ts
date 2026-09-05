import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";

const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api";
export const API_BASE_URL = rawBaseUrl.endsWith("/v1")
  ? rawBaseUrl.replace(/\/v1$/, "")
  : rawBaseUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const SESSION_TOKEN_CACHE_MS = 60 * 1000;
let cachedSessionToken: { value?: string; expiresAt: number } | null = null;
let pendingSessionToken: Promise<string | undefined> | null = null;

async function getSessionToken(): Promise<string | undefined> {
  if (cachedSessionToken && cachedSessionToken.expiresAt > Date.now()) {
    return cachedSessionToken.value;
  }

  if (!pendingSessionToken) {
    pendingSessionToken = getSession()
      .then((session) => {
        const value = session?.accessToken;
        cachedSessionToken = {
          value,
          expiresAt: Date.now() + SESSION_TOKEN_CACHE_MS,
        };
        return value;
      })
      .finally(() => {
        pendingSessionToken = null;
      });
  }

  return pendingSessionToken;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      try {
        const sessionToken = await getSessionToken();
        if (sessionToken) {
          config.headers.Authorization = `Bearer ${sessionToken}`;
          return config;
        }
      } catch {
        // Fall through to the locally stored token.
      }

      const token = localStorage.getItem("nk_access_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) cachedSessionToken = null;
    return Promise.reject(error);
  }
);

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  isVerified?: boolean;
  avatar?: string;
  image?: string;
  country?: string;
  cityState?: string;
  createdAt?: string;
  updatedAt?: string;
  checkInCount: number;
  reviewCount: number;
  status: "Aktiv" | "Inaktiv";
}

export interface RestaurantOwnerItem {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  cityState?: string;
  avatar?: string;
  role: "restaurant_owner";
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantOwnerPayload {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  country?: string;
  cityState?: string;
}

export interface CategoryItem {
  _id: string;
  categoryName: string;
}

export interface RestaurantItem {
  _id: string;
  title: string;
  shortDescription?: string;
  description: string;
  price: number;
  location?: {
    country?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  owner?: RestaurantOwnerItem | string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  dishes: DishItem[];
  images: string[];
  offers: string[];
  status: "activate" | "deactivate";
  category?: CategoryItem | string;
  rating: number;
  reviewCount: number;
  totalCheckIns: number;
  createdAt?: string;
}

export interface DishItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  images?: string[];
  category?: string;
  specialtyDescription?: string;
  ingredients?: string[];
  preparationProcess?: string;
  isSignatureDish: boolean;
  isActive: boolean;
}

export interface RestaurantPayload {
  title: string;
  shortDescription?: string;
  description: string;
  price?: number;
  category?: string;
  images?: string[];
  imageFiles?: File[];
  offers?: string[];
  location: {
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}

export interface AdminRestaurantPayload extends RestaurantPayload {
  owner: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
  };
}

export interface DishPayload {
  name: string;
  description?: string;
  price: number;
  image?: string;
  images?: string[];
  imageFiles?: File[];
  category?: string;
  specialtyDescription?: string;
  ingredients?: string[];
  preparationProcess?: string;
  isSignatureDish?: boolean;
  isActive?: boolean;
}

export interface ReviewItem {
  _id: string;
  userID?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  dealID?: {
    _id: string;
    title: string;
    images?: string[];
    location?: { country?: string; city?: string };
    category?: CategoryItem | string;
    dishes?: DishItem[];
  };
  dishID?: string;
  checkInID?: {
    _id: string;
    checkedInAt: string;
    partySize: number;
    distanceMeters: number;
    status: "verified";
  };
  restaurantName?: string;
  restaurantLocation?: string;
  restaurantAvatar?: string;
  dishName?: string;
  dishImage?: string;
  mealCategory?: string;
  reviewComment: string;
  ratings: number;
  createdAt?: string;
}

export interface ReviewRestaurantSummary {
  restaurantId: string;
  restaurantName: string;
  restaurantImages: string[];
  location?: { address?: string; city?: string; country?: string };
  totalReviews: number;
  averageRating: number;
  latestReviewAt?: string;
}

export interface LegalContent {
  termsHtml: string;
  privacyHtml: string;
  updatedAt?: string | null;
}

export interface CheckInItem {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    phoneNumber?: string;
  };
  restaurantId?: {
    _id: string;
    title: string;
    images?: string[];
    location?: { address?: string; city?: string; country?: string };
  };
  restaurantName?: string;
  restaurantLocation?: string;
  restaurantImage?: string;
  checkedInAt: string;
  partySize: number;
  distanceMeters: number;
  status: "verified";
}

export interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalReviews: number;
  totalCheckIns: number;
  activeRestaurantsPercent: number;
  userGrowthData: { month: string; users: number }[];
  restaurantWeeklyData: { day: string; active: number; total: number }[];
}

export interface MetaPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface BulkDeleteResponse {
  success: boolean;
  deletedCount: number;
  skippedCount?: number;
  message?: string;
}

interface RawUser
  extends Omit<UserItem, "checkInCount" | "reviewCount" | "status"> {
  checkInCount?: number;
  reviewCount?: number;
}

interface RawRestaurant extends Partial<RestaurantItem> {
  _id: string;
  title: string;
  description: string;
  price: number;
}

type RawReview = ReviewItem;

const emptyMeta = (
  params: { page?: number; limit?: number } | undefined,
  totalItems: number
): MetaPagination => {
  const itemsPerPage = params?.limit ?? 10;
  return {
    currentPage: params?.page ?? 1,
    totalPages: Math.ceil(totalItems / itemsPerPage),
    totalItems,
    itemsPerPage,
  };
};

const mapUser = (user: RawUser): UserItem => ({
  ...user,
  checkInCount: user.checkInCount ?? 0,
  reviewCount: user.reviewCount ?? 0,
  status: user.isVerified ? "Aktiv" : "Inaktiv",
});

const mapRestaurant = (deal: RawRestaurant): RestaurantItem => ({
  _id: deal._id,
  title: deal.title,
  shortDescription: deal.shortDescription,
  description: deal.description,
  price: deal.price,
  location: deal.location,
  owner: deal.owner,
  approvalStatus: deal.approvalStatus ?? "approved",
  rejectionReason: deal.rejectionReason,
  dishes: deal.dishes ?? [],
  images: deal.images ?? [],
  offers: deal.offers ?? [],
  status: deal.status === "activate" ? "activate" : "deactivate",
  category: deal.category,
  rating: deal.rating ?? 0,
  reviewCount: deal.reviewCount ?? 0,
  totalCheckIns: deal.totalCheckIns ?? 0,
  createdAt: deal.createdAt,
});

const mapReview = (review: RawReview): ReviewItem => {
  const deal = review.dealID;
  const location = [deal?.location?.city, deal?.location?.country]
    .filter(Boolean)
    .join(", ");
  const category = deal?.category;
  const dish = deal?.dishes?.find((item) => item._id === review.dishID);

  return {
    ...review,
    restaurantName: deal?.title,
    restaurantLocation: location || undefined,
    restaurantAvatar: deal?.images?.[0],
    dishName: review.dishName,
    dishImage: dish?.image || deal?.images?.[0],
    mealCategory:
      dish?.category ||
      (typeof category === "object" ? category.categoryName : undefined),
  };
};

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data?.token && typeof window !== "undefined") {
      localStorage.setItem("nk_access_token", response.data.token);
      localStorage.setItem("nk_user", JSON.stringify(response.data.data));
    }
    return response.data;
  },
  forgotPassword: async (data: { email: string }) =>
    (await api.post("/auth/forgot-password", data)).data,
  verifyOtp: async (data: { email: string; code: string }) => {
    const response = await api.post("/auth/verify", data);
    if (response.data?.token && typeof window !== "undefined") {
      localStorage.setItem("nk_access_token", response.data.token);
    }
    return response.data;
  },
  resetPassword: async (data: {
    token?: string;
    email: string;
    password: string;
  }) => (await api.post("/auth/reset-password", data)).data,
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    userId: string;
  }) => (await api.post("/auth/change-password", data)).data,
  updateProfile: async (formData: FormData) =>
    (
      await api.put("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data,
  updateProfileJson: async (data: {
    userId: string;
    name?: string;
    phoneNumber?: string;
    country?: string;
    cityState?: string;
    avatar?: string;
  }) => (await api.put("/auth/update-profile", data)).data,
  getUserById: async (id: string) =>
    mapUser((await api.get(`/auth/single-user/${id}`)).data.data),
};

export const userApi = {
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: UserItem[]; meta: MetaPagination }> => {
    const response = await api.get("/auth/all/user", { params });
    const users: RawUser[] = response.data?.data ?? [];
    return {
      data: users.map(mapUser),
      meta: response.data?.meta ?? emptyMeta(params, users.length),
    };
  },
  getUserById: async (id: string): Promise<UserItem> => {
    const [userResponse, checkInsResponse, reviewsResponse] = await Promise.all([
      api.get(`/auth/single-user/${id}`),
      api.get(`/check-ins/user/${id}`, { params: { page: 1, limit: 1 } }),
      api.get("/reviews", { params: { userId: id, page: 1, limit: 1 } }),
    ]);
    return mapUser({
      ...userResponse.data.data,
      checkInCount: checkInsResponse.data?.meta?.totalItems ?? 0,
      reviewCount: reviewsResponse.data?.meta?.totalItems ?? 0,
    });
  },
  bulkDeleteUsers: async (ids: string[]): Promise<BulkDeleteResponse> =>
    (await api.delete("/auth/delete/users", { data: { ids } })).data,
};

export const restaurantOwnerApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: RestaurantOwnerItem[]; meta: MetaPagination }> => {
    const response = await api.get("/auth/restaurant-owners", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search || undefined,
      },
    });
    const owners: RestaurantOwnerItem[] = response.data?.data ?? [];
    return {
      data: owners,
      meta: response.data?.meta ?? emptyMeta(params, owners.length),
    };
  },
  create: async (data: RestaurantOwnerPayload): Promise<RestaurantOwnerItem> =>
    (await api.post("/auth/restaurant-owners", data)).data.data,
  update: async (
    id: string,
    data: RestaurantOwnerPayload
  ): Promise<RestaurantOwnerItem> =>
    (await api.put(`/auth/restaurant-owners/${id}`, data)).data.data,
};

const mapCheckIn = (checkIn: CheckInItem): CheckInItem => {
  const restaurant = checkIn.restaurantId;
  const location = [
    restaurant?.location?.address,
    restaurant?.location?.city,
    restaurant?.location?.country,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    ...checkIn,
    restaurantName: restaurant?.title,
    restaurantLocation: location || undefined,
    restaurantImage: restaurant?.images?.[0],
  };
};

export const checkInApi = {
  getAll: async (
    role: "admin" | "restaurant_owner",
    params?: { page?: number; limit?: number; restaurantId?: string; from?: string; to?: string }
  ): Promise<{
    data: CheckInItem[];
    meta: MetaPagination;
    stats: { total: number; today: number };
  }> => {
    const endpoint = role === "restaurant_owner" ? "/check-ins/owner" : "/check-ins/admin";
    const response = await api.get(endpoint, { params });
    const checkIns: CheckInItem[] = response.data?.data ?? [];
    return {
      data: checkIns.map(mapCheckIn),
      meta: response.data?.meta ?? emptyMeta(params, checkIns.length),
      stats: response.data?.stats ?? { total: checkIns.length, today: 0 },
    };
  },
  getForUser: async (userId: string): Promise<CheckInItem[]> => {
    const response = await api.get(`/check-ins/user/${userId}`, {
      params: { page: 1, limit: 100 },
    });
    const checkIns: CheckInItem[] = response.data?.data ?? [];
    return checkIns.map(mapCheckIn);
  },
};

const createDishFormData = (data: DishPayload): FormData => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("price", String(data.price));
  formData.append("description", data.description ?? "");
  formData.append("category", data.category ?? "");
  formData.append("specialtyDescription", data.specialtyDescription ?? "");
  formData.append("ingredients", JSON.stringify(data.ingredients ?? []));
  formData.append("preparationProcess", data.preparationProcess ?? "");
  formData.append("isSignatureDish", String(Boolean(data.isSignatureDish)));
  formData.append("isActive", String(data.isActive ?? true));

  formData.append("existingImages", JSON.stringify(data.images ?? []));
  data.imageFiles?.forEach((file) => formData.append("images", file));

  return formData;
};

const createRestaurantFormData = (
  data: RestaurantPayload | AdminRestaurantPayload
): FormData => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("shortDescription", data.shortDescription ?? "");
  formData.append("description", data.description);
  formData.append("price", String(data.price ?? 0));
  formData.append("location", JSON.stringify(data.location));
  formData.append("existingImages", JSON.stringify(data.images ?? []));
  formData.append("offers", JSON.stringify(data.offers ?? []));

  if (data.category) formData.append("category", data.category);
  if ("owner" in data) formData.append("owner", JSON.stringify(data.owner));
  data.imageFiles?.forEach((file) => formData.append("images", file));

  return formData;
};

export const restaurantApi = {
  getAllRestaurants: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ data: RestaurantItem[]; meta: MetaPagination }> => {
    const response = await api.get("/manage/deals", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        title: params?.search || undefined,
        status: params?.status || undefined,
      },
    });
    const deals: RawRestaurant[] = response.data?.restaurants ?? [];
    return {
      data: deals.map(mapRestaurant),
      meta: response.data?.pagination ?? emptyMeta(params, deals.length),
    };
  },
  getRestaurantById: async (id: string): Promise<RestaurantItem> => {
    const response = await api.get(`/manage/deals/${id}`);
    return mapRestaurant(response.data.restaurant);
  },
  getMine: async (): Promise<RestaurantItem | null> => {
    const response = await api.get("/owner/restaurant");
    return response.data.restaurant ? mapRestaurant(response.data.restaurant) : null;
  },
  submitMine: async (data: RestaurantPayload): Promise<RestaurantItem> => {
    const response = await api.post(
      "/owner/restaurant",
      createRestaurantFormData(data),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return mapRestaurant(response.data.restaurant);
  },
  resubmitMine: async (id: string, data: RestaurantPayload): Promise<RestaurantItem> => {
    const response = await api.put(
      `/owner/restaurant/${id}`,
      createRestaurantFormData(data),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return mapRestaurant(response.data.restaurant);
  },
  createWithOwner: async (data: AdminRestaurantPayload): Promise<RestaurantItem> => {
    const response = await api.post(
      "/admin/restaurants",
      createRestaurantFormData(data),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return mapRestaurant(response.data.restaurant);
  },
  updateRestaurant: async (id: string, data: RestaurantPayload): Promise<RestaurantItem> => {
    const response = await api.put(
      `/admin/restaurants/${id}`,
      createRestaurantFormData(data),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return mapRestaurant(response.data.restaurant);
  },
  updateApproval: async (
    id: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<RestaurantItem> => {
    const response = await api.patch(`/admin/restaurants/${id}/approval`, {
      status,
      rejectionReason,
    });
    return mapRestaurant(response.data.restaurant);
  },
  addDish: async (id: string, data: DishPayload): Promise<RestaurantItem> => {
    const formData = createDishFormData(data);
    const response = await api.post(`/restaurants/${id}/dishes`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapRestaurant(response.data.restaurant);
  },
  updateDish: async (id: string, dishId: string, data: DishPayload): Promise<RestaurantItem> => {
    const formData = createDishFormData(data);
    const response = await api.put(`/restaurants/${id}/dishes/${dishId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapRestaurant(response.data.restaurant);
  },
  deleteDish: async (id: string, dishId: string): Promise<RestaurantItem> => {
    const response = await api.delete(`/restaurants/${id}/dishes/${dishId}`);
    return mapRestaurant(response.data.restaurant);
  },
  toggleStatus: async (id: string) =>
    (await api.patch(`/deals/${id}/status`)).data,
  bulkDeleteRestaurants: async (ids: string[]): Promise<BulkDeleteResponse> =>
    (await api.delete("/deals/bulk", { data: { ids } })).data,
};

export const reviewApi = {
  getRestaurantSummaries: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: ReviewRestaurantSummary[]; meta: MetaPagination }> => {
    const response = await api.get('/review-restaurants', { params });
    const data: ReviewRestaurantSummary[] = response.data?.data ?? [];
    return {
      data,
      meta: response.data?.meta ?? emptyMeta(params, data.length),
    };
  },
  getAllReviews: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    dealId?: string;
  }): Promise<{ data: ReviewItem[]; meta: MetaPagination }> => {
    const response = await api.get("/reviews", { params });
    const reviews: RawReview[] = response.data?.data ?? [];
    return {
      data: reviews.map(mapReview),
      meta: response.data?.meta ?? emptyMeta(params, reviews.length),
    };
  },
  getReviewsByDeal: async (dealId: string) =>
    reviewApi.getAllReviews({ dealId }),
  updateReview: async (
    id: string,
    data: { reviewComment: string; ratings: number }
  ): Promise<ReviewItem> => {
    const response = await api.put(`/reviews/${id}`, data);
    return mapReview(response.data.review);
  },
  deleteReview: async (id: string): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
  bulkDeleteReviews: async (ids: string[]): Promise<BulkDeleteResponse> =>
    (await api.delete("/reviews/bulk", { data: { ids } })).data,
};

export const contentApi = {
  getLegalContent: async (): Promise<LegalContent> => {
    const response = await api.get('/content/legal');
    return response.data?.content ?? { termsHtml: '', privacyHtml: '' };
  },
  updateLegalContent: async (payload: {
    termsHtml?: string;
    privacyHtml?: string;
  }): Promise<LegalContent> => {
    const response = await api.put('/content/legal', payload);
    return response.data?.content;
  },
};

export const statsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/dashboard/stats");
    const stats = response.data?.data ?? {};
    const totalRestaurants = stats.totalDeals ?? 0;
    const activeRestaurants = stats.activeDeals ?? 0;
    return {
      totalUsers: stats.totalCustomers ?? 0,
      totalRestaurants,
      totalReviews: stats.totalReviews ?? 0,
      totalCheckIns: stats.totalCheckIns ?? 0,
      activeRestaurantsPercent:
        totalRestaurants > 0
          ? Math.round((activeRestaurants / totalRestaurants) * 100)
          : 0,
      userGrowthData: stats.userGrowthData ?? [],
      restaurantWeeklyData: stats.restaurantWeeklyData ?? [],
    };
  },
};
