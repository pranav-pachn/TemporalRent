import { DashboardDTO } from '../types/dashboard';
import { InventoryItem, InventoryReservation, InventoryBooking, InventoryDamageReport, InventoryMovement } from '../types/inventory';
import { Package, PackageVersion } from '../types/package';
import { CreateBookingInput, BookingDTO, AvailabilityResult, CustomerDTO } from '../types/bookings';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, ...errorData };
    }

    return response.json();
  },

  post: async (endpoint: string, data: any, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, ...errorData };
    }

    return response.json();
  },

  fetchDashboard: async (options: RequestInit = {}): Promise<DashboardDTO> => {
    return apiClient.get('/api/v1/dashboard', options);
  },

  fetchInventoryItems: async (options: RequestInit = {}): Promise<{ data: InventoryItem[] }> => {
    return apiClient.get('/api/v1/inventory', options);
  },

  fetchInventoryItem: async (id: string, options: RequestInit = {}): Promise<{ data: InventoryItem }> => {
    return apiClient.get(`/api/v1/inventory/${id}`, options);
  },

  fetchInventoryReservations: async (id: string, from: string, to: string, options: RequestInit = {}): Promise<{ data: InventoryReservation[] }> => {
    return apiClient.get(`/api/v1/inventory/${id}/reservations?from=${from}&to=${to}`, options);
  },

  fetchInventoryBookings: async (id: string, options: RequestInit = {}): Promise<{ data: InventoryBooking[] }> => {
    return apiClient.get(`/api/v1/inventory/${id}/bookings`, options);
  },

  fetchInventoryDamage: async (id: string, options: RequestInit = {}): Promise<{ data: InventoryDamageReport[] }> => {
    return apiClient.get(`/api/v1/inventory/${id}/damage`, options);
  },

  fetchInventoryMovements: async (id: string, options: RequestInit = {}): Promise<{ data: InventoryMovement[] }> => {
    return apiClient.get(`/api/v1/inventory/${id}/movements`, options);
  },

  fetchPackages: async (options: RequestInit = {}): Promise<{ data: Package[] }> => {
    return apiClient.get('/api/v1/packages', options);
  },

  fetchPackage: async (id: string, options: RequestInit = {}): Promise<{ data: Package }> => {
    return apiClient.get(`/api/v1/packages/${id}`, options);
  },

  fetchPackageVersions: async (id: string, options: RequestInit = {}): Promise<{ data: PackageVersion[] }> => {
    return apiClient.get(`/api/v1/packages/${id}/versions`, options);
  },

  activatePackageVersion: async (packageId: string, versionId: string, options: RequestInit = {}): Promise<{ data: PackageVersion }> => {
    return apiClient.post(`/api/v1/packages/${packageId}/versions/${versionId}/activate`, {}, options);
  },

  fetchCustomers: async (options: RequestInit = {}): Promise<{ data: CustomerDTO[] }> => {
    return apiClient.get('/api/v1/customers', options);
  },

  createBookingDraft: async (data: CreateBookingInput, options: RequestInit = {}): Promise<{ data: BookingDTO }> => {
    return apiClient.post('/api/v1/bookings', data, options);
  },

  checkRealTimeAvailability: (lines: BookingLineInput[], eventStart: string, eventEnd: string, options?: RequestInit) =>
    apiClient.post('/api/v1/availability/check', { lines, eventStart, eventEnd }, options),

  checkBookingAvailability: async (id: string, options: RequestInit = {}): Promise<AvailabilityResult> => {
    return apiClient.post(`/api/v1/bookings/${id}/check-availability`, {}, options);
  },

  quoteBooking: async (id: string, options: RequestInit = {}): Promise<{ data: BookingDTO }> => {
    return apiClient.post(`/api/v1/bookings/${id}/quote`, {}, options);
  },

  confirmBooking: async (id: string, idempotencyKey: string, options: RequestInit = {}): Promise<{ status: string }> => {
    return apiClient.post(`/api/v1/bookings/${id}/confirm`, {}, {
      ...options,
      headers: {
        ...options.headers,
        'Idempotency-Key': idempotencyKey,
      }
    });
  },

  // Calendar Endpoints
  fetchCalendarEvents: (from: string, to: string) => 
    apiClient.get(`/api/v1/calendar/events?from=${from}&to=${to}`),
    
  fetchCalendarInventory: (from: string, to: string, inventoryItemId?: string) => 
    apiClient.get(`/api/v1/calendar/inventory?from=${from}&to=${to}${inventoryItemId ? `&inventoryItemId=${inventoryItemId}` : ''}`),
};
