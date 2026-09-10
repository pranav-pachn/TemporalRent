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
import { AuditFilters, ListAuditEventsResponse } from '../types/audit';

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

  patch: async (endpoint: string, data: any, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
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
      throw new Error(errorData.error || errorData.message || 'API Error');
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

  delete: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
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

  fetchDashboard: async (options: RequestInit = {}): Promise<DashboardDTO> => {
    return apiClient.get('/api/v1/dashboard', options);
  },

  fetchInventoryItems: async (options: RequestInit = {}): Promise<{ data: InventoryItem[] }> => {
    return apiClient.get('/api/v1/inventory', options);
  },

  createInventoryItem: async (
    data: { name: string; sku?: string; totalQty?: number; categoryId?: string },
    options: RequestInit = {}
  ): Promise<{ data: InventoryItem }> => {
    return apiClient.post('/api/v1/inventory', data, options);
  },

  fetchInventoryItem: async (id: string, options: RequestInit = {}): Promise<{ data: InventoryItem }> => {
    return apiClient.get(`/api/v1/inventory/${id}`, options);
  },

  updateInventoryItem: async (id: string, data: Partial<InventoryItem>, options: RequestInit = {}): Promise<{ data: InventoryItem }> => {
    return apiClient.patch(`/api/v1/inventory/${id}`, data, options);
  },

  adjustInventoryItem: async (id: string, data: { quantityDelta: number; notes?: string }, options: RequestInit = {}): Promise<{ data: InventoryItem }> => {
    return apiClient.post(`/api/v1/inventory/${id}/adjust`, data, options);
  },

  deleteInventoryItem: async (id: string, options: RequestInit = {}): Promise<{ data: any }> => {
    return apiClient.delete(`/api/v1/inventory/${id}`, options);
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

  createPackage: async (
    data: { name: string; description?: string },
    options: RequestInit = {}
  ): Promise<{ data: Package }> => {
    return apiClient.post('/api/v1/packages', data, options);
  },

  deletePackage: async (id: string, options: RequestInit = {}): Promise<{ data: any }> => {
    return apiClient.delete(`/api/v1/packages/${id}`, options);
  },

  fetchPackageVersions: async (id: string, options: RequestInit = {}): Promise<{ data: PackageVersion[] }> => {
    return apiClient.get(`/api/v1/packages/${id}/versions`, options);
  },

  createPackageVersion: async (
    packageId: string,
    data: { components: Array<{ inventoryItemId: string; quantity: number }> },
    options: RequestInit = {}
  ): Promise<{ data: PackageVersion }> => {
    return apiClient.post(`/api/v1/packages/${packageId}/versions`, data, options);
  },

  activatePackageVersion: async (packageId: string, versionId: string, options: RequestInit = {}): Promise<{ data: PackageVersion }> => {
    return apiClient.post(`/api/v1/packages/${packageId}/versions/${versionId}/activate`, {}, options);
  },

  fetchCustomers: async (options: RequestInit = {}): Promise<{ data: CustomerDTO[] }> => {
    return apiClient.get('/api/v1/customers', options);
  },

  createCustomer: async (
    data: { name: string; email?: string; phone?: string },
    options: RequestInit = {}
  ): Promise<{ data: CustomerDTO }> => {
    return apiClient.post('/api/v1/customers', data, options);
  },

  deleteCustomer: async (id: string, options: RequestInit = {}): Promise<{ message: string }> => {
    return apiClient.delete(`/api/v1/customers/${id}`, options);
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

  cancelBooking: async (id: string, idempotencyKey: string, reason?: string, options: RequestInit = {}): Promise<{ data: any }> => {
    return apiClient.post(`/api/v1/bookings/${id}/cancel`, { reason }, {
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

  // Settings Endpoints
  getBusinessSettings: () => 
    apiClient.get('/api/v1/settings/business'),

  updateBusinessSettings: (data: { defaultBufferBeforeMinutes?: number; defaultBufferAfterMinutes?: number }) => 
    apiClient.patch('/api/v1/settings/business', data),

  // Audit
  fetchAuditEvents: (filters: AuditFilters = {}, options: RequestInit = {}): Promise<ListAuditEventsResponse> => {
    const params = new URLSearchParams();
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = `/api/v1/audit${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url, options);
  },
};
