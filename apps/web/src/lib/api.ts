import { DashboardDTO } from '../types/dashboard';
import { InventoryItem, InventoryReservation, InventoryBooking, InventoryDamageReport, InventoryMovement } from '../types/inventory';
import { Package, PackageVersion } from '../types/package';
import { CreateBookingInput, BookingDTO, AvailabilityResult, CustomerDTO, BookingLineInput, BookingDetailDTO } from '../types/bookings';
import { 
  DispatchDTO, 
  DispatchStatus, 
  ReturnsListResponse, 
  ReturnInspectionDTO, 
  ReturnInspectionLineInput, 
  ReturnDTO, 
  DamageReportDTO 
} from '../types/warehouse';

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

  fetchBookingsList: async (page = 1, limit = 50, options: RequestInit = {}): Promise<{ data: BookingDTO[]; total: number }> => {
    return apiClient.get(`/api/v1/bookings?page=${page}&limit=${limit}`, options);
  },

  fetchBookingById: async (id: string, options: RequestInit = {}): Promise<{ data: BookingDetailDTO }> => {
    return apiClient.get(`/api/v1/bookings/${id}`, options);
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

  // Warehouse Dispatches
  fetchDispatches: async (status?: DispatchStatus, options: RequestInit = {}): Promise<{ data: DispatchDTO[] }> => {
    const url = status ? `/api/v1/dispatches?status=${status}` : '/api/v1/dispatches';
    return apiClient.get(url, options);
  },

  fetchDispatchById: async (id: string, options: RequestInit = {}): Promise<{ data: DispatchDTO }> => {
    return apiClient.get(`/api/v1/dispatches/${id}`, options);
  },

  prepareDispatch: async (bookingId: string, options: RequestInit = {}): Promise<{ data: DispatchDTO }> => {
    return apiClient.post(`/api/v1/bookings/${bookingId}/dispatch/prepare`, {}, options);
  },

  startPicking: async (bookingId: string, options: RequestInit = {}): Promise<{ data: DispatchDTO }> => {
    return apiClient.post(`/api/v1/bookings/${bookingId}/dispatch/start-picking`, {}, options);
  },

  confirmDispatch: async (
    bookingId: string, 
    idempotencyKey: string, 
    lines: Array<{ dispatchLineId: string; dispatchedQty: number }>,
    options: RequestInit = {}
  ): Promise<{ data: DispatchDTO }> => {
    return apiClient.post(`/api/v1/bookings/${bookingId}/dispatch/confirm`, { lines }, {
      ...options,
      headers: {
        ...options.headers,
        'Idempotency-Key': idempotencyKey,
      }
    });
  },

  // Warehouse Returns
  fetchReturnsList: async (options: RequestInit = {}): Promise<ReturnsListResponse> => {
    return apiClient.get('/api/v1/returns', options);
  },

  fetchReturnInspection: async (bookingId: string, options: RequestInit = {}): Promise<{ data: ReturnInspectionDTO }> => {
    return apiClient.get(`/api/v1/returns/${bookingId}/inspection`, options);
  },

  completeReturn: async (
    bookingId: string,
    idempotencyKey: string,
    lines: ReturnInspectionLineInput[],
    options: RequestInit = {}
  ): Promise<{ data: ReturnDTO }> => {
    return apiClient.post(`/api/v1/bookings/${bookingId}/return/complete`, { lines }, {
      ...options,
      headers: {
        ...options.headers,
        'Idempotency-Key': idempotencyKey,
      }
    });
  },

  // Warehouse Damage
  fetchDamageReports: async (type?: 'ALL' | 'DAMAGED' | 'MISSING', options: RequestInit = {}): Promise<{ data: DamageReportDTO[] }> => {
    const url = type && type !== 'ALL' ? `/api/v1/damage-reports?type=${type}` : '/api/v1/damage-reports';
    return apiClient.get(url, options);
  },

  // Calendar Endpoints
  fetchCalendarEvents: (from: string, to: string) => 
    apiClient.get(`/api/v1/calendar/events?from=${from}&to=${to}`),
    
  fetchCalendarInventory: (from: string, to: string, inventoryItemId?: string) => 
    apiClient.get(`/api/v1/calendar/inventory?from=${from}&to=${to}${inventoryItemId ? `&inventoryItemId=${inventoryItemId}` : ''}`),
};
