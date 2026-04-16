import axiosInstance from './axiosInstance'

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface Application {
  id: string
  listingId: string
  applicantId: string
  monthlyIncome: number
  employmentStatus: string
  message: string | null
  startDate: string | null
  endDate: string | null
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  listingTitle: string | null
  listingCity: string | null
  listingPrice: number | null
  listingOwnerId: string | null
  applicantFullName: string | null
  applicantEmail: string | null
}

export interface CreateApplicationData {
  listingId: string
  monthlyIncome: number
  employmentStatus: string
  message?: string
  startDate?: string | null
  endDate?: string | null
}

export const applicationsApi = {
  create: (data: CreateApplicationData) =>
    axiosInstance
      .post<Application>('/api/applications', data)
      .then((r) => r.data),

  getMine: () =>
    axiosInstance
      .get<Application[]>('/api/applications/mine')
      .then((r) => r.data),

  getReceived: () =>
    axiosInstance
      .get<Application[]>('/api/applications/received')
      .then((r) => r.data),

  accept: (id: string) =>
    axiosInstance
      .post<Application>(`/api/applications/${id}/accept`)
      .then((r) => r.data),

  reject: (id: string) =>
    axiosInstance
      .post<Application>(`/api/applications/${id}/reject`)
      .then((r) => r.data),
}
