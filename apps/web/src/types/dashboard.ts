export interface DashboardDTO {
  user: {
    name: string;
  };
  today: {
    events: number;
    dispatches: number;
    returns: number;
  };
  inventoryAlerts: {
    id: string;
    name: string;
    totalQty: number;
    committedQty: number;
    availableQty: number;
    urgency: 'attention' | 'critical';
  }[];
  todayDispatches: {
    id: string;
    bookingId: string;
    clientName: string;
    scheduledTime: string | null;
    itemCount: number;
    status: string;
  }[];
  todayReturns: {
    id: string;
    bookingId: string;
    clientName: string;
    scheduledTime: string | null;
    itemCount: number;
    status: string;
  }[];
  upcomingBookings: {
    id: string;
    clientName: string;
    eventDate: string;
    status: string;
  }[];
}
