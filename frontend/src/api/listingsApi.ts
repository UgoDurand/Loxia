import axiosInstance from './axiosInstance'

export interface ListingSummary {
  id: string
  title: string
  propertyType: string
  city: string
  price: number
  surface: number
  rooms: number
  photoUrl: string | null
  ownerId: string
}

export interface ListingDetail {
  id: string
  title: string
  description: string | null
  propertyType: string
  city: string
  price: number
  surface: number
  rooms: number
  photoUrls: string[]
  ownerId: string
  ownerName: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateListingData {
  title: string
  description?: string
  propertyType: string
  city: string
  price: number
  surface: number
  rooms: number
  photoUrls?: string[]
}

export interface UpdateListingData extends CreateListingData {}

export interface ListingSearchParams {
  city?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
}

export const listingsApi = {
  search: (params?: ListingSearchParams) =>
    axiosInstance
      .get<ListingSummary[]>('/api/listings', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<ListingDetail>(`/api/listings/${id}`).then((r) => r.data),

  getMine: () =>
    axiosInstance.get<ListingSummary[]>('/api/listings/mine').then((r) => r.data),

  create: (data: CreateListingData) =>
    axiosInstance.post<ListingDetail>('/api/listings', data).then((r) => r.data),

  update: (id: string, data: UpdateListingData) =>
    axiosInstance.put<ListingDetail>(`/api/listings/${id}`, data).then((r) => r.data),

  delete: (id: string) => axiosInstance.delete(`/api/listings/${id}`),
}
