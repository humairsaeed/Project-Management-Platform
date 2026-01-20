/**
 * API Response Types
 */

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface ApiError {
  success: false
  error: string
  detail?: string
  code?: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}
