import axiosInstance from './axiosInstance'

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UserData {
  id: string
  email: string
  fullName: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserData
}

export const authApi = {
  register: (data: RegisterRequest) =>
    axiosInstance.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    axiosInstance.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    axiosInstance
      .post<AuthResponse>('/api/auth/refresh', { refreshToken })
      .then((r) => r.data),

  logout: (refreshToken: string) =>
    axiosInstance.post('/api/auth/logout', { refreshToken }),

  getMe: () => axiosInstance.get<UserData>('/api/auth/me').then((r) => r.data),

  updateMe: (data: { fullName: string; email: string }) =>
    axiosInstance.put<UserData>('/api/auth/me', data).then((r) => r.data),
}
