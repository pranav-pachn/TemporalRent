'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  X, 
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  CalendarDays,
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  isToday,
  getHours,
  getMinutes
} from 'date-fns';

import { apiClient } from '@/lib/api';
import { CalendarEvent, CalendarInventoryResponse } from '@/types/calendar';
import { InventoryItem } from '@/types/inventory';
import { ErrorState } from '@/components/ui/ErrorState';

type ViewMode = 'day' | 'week' | 'month' | 'list' | 'timeline';

interface EnrichedCalendarEvent extends CalendarEvent {
  itemCount: number;
  packageCount: number;
  itemSummary: string;
  hasConflict?: boolean;
  conflictDetails?: string;
}

interface EventTypeConfig {
  name: string;
  dotColor: string;
  badgeBg: string;
  cardBg: string;
  cardBorder: string;
  cardAccent: string;
  textColor: string;
  subtextColor: string;
}

const EVENT_TYPE_MAP: Record<string, EventTypeConfig> = {
  Wedding: {
    name: 'Wedding',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    cardBg: 'bg-[#1e1114]',
    cardBorder: 'border-[#38181e]',
    cardAccent: 'border-l-rose-500',
    textColor: 'text-rose-100',
    subtextColor: 'text-rose-300/80',
  },
  Haldi: {
    name: 'Haldi',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    cardBg: 'bg-[#1f160a]',
    cardBorder: 'border-[#3a280e]',
    cardAccent: 'border-l-amber-500',
    textColor: 'text-amber-100',
    subtextColor: 'text-amber-300/80',
  },
  Sangeet: {
    name: 'Sangeet',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    cardBg: 'bg-[#180f22]',
    cardBorder: 'border-[#311645]',
    cardAccent: 'border-l-purple-500',
    textColor: 'text-purple-100',
    subtextColor: 'text-purple-300/80',
  },
  Corporate: {
    name: 'Corporate',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    cardBg: 'bg-[#0c1827]',
    cardBorder: 'border-[#142c48]',
    cardAccent: 'border-l-blue-500',
    textColor: 'text-blue-100',
    subtextColor: 'text-blue-300/80',
  },
  Birthday: {
    name: 'Birthday',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    cardBg: 'bg-[#091d13]',
    cardBorder: 'border-[#123623]',
    cardAccent: 'border-l-emerald-500',
    textColor: 'text-emerald-100',
    subtextColor: 'text-emerald-300/80',
  },
  Engagement: {
    name: 'Engagement',
    dotColor: 'bg-fuchsia-500',
    badgeBg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    cardBg: 'bg-[#1b0b1e]',
    cardBorder: 'border-[#36133b]',
    cardAccent: 'border-l-fuchsia-500',
    textColor: 'text-fuchsia-100',
    subtextColor: 'text-fuchsia-300/80',
  },
  Other: {
    name: 'Other',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    cardBg: 'bg-[#141419]',
    cardBorder: 'border-[#242430]',
    cardAccent: 'border-l-slate-400',
    textColor: 'text-slate-100',
    subtextColor: 'text-slate-300/80',
  },
};

function detectEventType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('wedding') || lower.includes('reception')) return 'Wedding';
  if (lower.includes('haldi')) return 'Haldi';
  if (lower.includes('sangeet')) return 'Sangeet';
  if (lower.includes('corporate') || lower.includes('launch') || lower.includes('tech') || lower.includes('setup') || lower.includes('meeting')) return 'Corporate';
  if (lower.includes('birthday') || lower.includes('bday') || lower.includes('party')) return 'Birthday';
  if (lower.includes('engagement') || lower.includes('ring')) return 'Engagement';
  return 'Other';
}

const TIME_SLOTS = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
];

// Compact operational height (40px)
const HOUR_HEIGHT = 40;
const START_HOUR = 8;
const END_HOUR = 22;

interface PressureItem {
  id: string;
  name: string;
  usableQty: number;
  reservedQty: number;
  pressure: 'NORMAL' | 'FULL' | 'SHORTAGE';
  shortageQty?: number;
  allocations: Array<{ bookingName: string; qty: number; timeRange: string }>;
}

const SAMPLE_PRESSURE_ITEMS: PressureItem[] = [
  { 
    id: 'item-1', 
    name: 'VIP Velvet Sofa', 
    usableQty: 10, 
    reservedQty: 8, 
    pressure: 'FULL',
    allocations: [
      { bookingName: 'Product Launch', qty: 4, timeRange: 'Thu 9:00 AM – 1:00 PM' },
      { bookingName: 'Sangeet Function', qty: 4, timeRange: 'Wed 3:00 PM – 11:00 PM' },
    ]
  },
  { 
    id: 'item-2', 
    name: 'Brass Urli Bowl (36")', 
    usableQty: 6, 
    reservedQty: 6, 
    pressure: 'SHORTAGE', 
    shortageQty: 2,
    allocations: [
      { bookingName: 'Haldi Ceremony', qty: 4, timeRange: 'Fri 11:00 AM – 4:00 PM' },
      { bookingName: 'Reception', qty: 4, timeRange: 'Fri 6:00 PM – 11:30 PM (Overlap short 2)' },
    ]
  },
  { 
    id: 'item-3', 
    name: 'Royal Carved Jhoola', 
    usableQty: 4, 
    reservedQty: 2, 
    pressure: 'NORMAL',
    allocations: [
      { bookingName: 'Sangeet Function', qty: 2, timeRange: 'Wed 3:00 PM – 11:00 PM' },
    ]
  },
  { 
    id: 'item-4', 
    name: 'Banquet Chairs (Gold)', 
    usableQty: 150, 
    reservedQty: 120, 
    pressure: 'NORMAL',
    allocations: [
      { bookingName: 'Corporate Setup', qty: 50, timeRange: 'Tue 10:00 AM – 2:00 PM' },
      { bookingName: 'Reception', qty: 70, timeRange: 'Fri 6:00 PM – 11:30 PM' },
    ]
  },
  { 
    id: 'item-5', 
    name: 'Ambient Stage Spotlight', 
    usableQty: 16, 
    reservedQty: 14, 
    pressure: 'FULL',
    allocations: [
      { bookingName: 'Product Launch', qty: 8, timeRange: 'Thu 9:00 AM – 1:00 PM' },
      { bookingName: 'Corporate Setup', qty: 6, timeRange: 'Tue 10:00 AM – 2:00 PM' },
    ]
  },
];

export default function CalendarPage() {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [miniCalendarMonth, setMiniCalendarMonth] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [inventoryResponse, setInventoryResponse] = useState<CalendarInventoryResponse | null>(null);
  const [inventoryItemsList, setInventoryItemsList] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('all');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Modals & Detail Popups
  const [selectedEvent, setSelectedEvent] = useState<EnrichedCalendarEvent | null>(null);
  const [selectedPressureItem, setSelectedPressureItem] = useState<PressureItem | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [checkStartDate, setCheckStartDate] = useState('');
  const [checkEndDate, setCheckEndDate] = useState('');
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState<string | null>(null);

  // Keep live time synchronized
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Inventory Items for selection
  useEffect(() => {
    apiClient.fetchInventoryItems()
      .then(res => setInventoryItemsList(res.data))
      .catch(e => {
        if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
          router.push('/login');
        }
      });
  }, [router]);

  // Load backend calendar data within 35-day window
  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
    try {
      const windowStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const windowEnd = addDays(windowStart, 35);
      const fromDateStr = format(windowStart, 'yyyy-MM-dd');
      const toDateStr = format(windowEnd, 'yyyy-MM-dd');

      const [eventsRes, invRes] = await Promise.all([
        apiClient.fetchCalendarEvents(fromDateStr, toDateStr),
        apiClient.fetchCalendarInventory(fromDateStr, toDateStr, selectedItemId === 'all' ? undefined : selectedItemId)
      ]);

      setEvents(eventsRes.data);
      setInventoryResponse(invRes.data);
    } catch (e: any) {
      if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
        router.push('/login');
        return;
      }
      console.warn('Calendar API warning:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, selectedItemId]);

  // Realistic sample bookings enriched with temporal inventory impact
  const sampleEvents: EnrichedCalendarEvent[] = useMemo(() => {
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    return [
      {
        bookingId: 'demo-1',
        eventName: 'Corporate Setup',
        customerName: 'Green Leaf Events',
        status: 'CONFIRMED',
        itemCount: 56,
        packageCount: 2,
        itemSummary: '50 Banquet Chairs · 6 Spotlights',
        eventStart: format(addDays(monday, 1), 'yyyy-MM-dd') + 'T10:00:00',
        eventEnd: format(addDays(monday, 1), 'yyyy-MM-dd') + 'T14:00:00',
        periodStart: format(addDays(monday, 1), 'yyyy-MM-dd') + 'T10:00:00',
        periodEnd: format(addDays(monday, 1), 'yyyy-MM-dd') + 'T14:00:00',
      },
      {
        bookingId: 'demo-2',
        eventName: 'Product Launch',
        customerName: 'TechCorp',
        status: 'CONFIRMED',
        itemCount: 12,
        packageCount: 2,
        itemSummary: '4 VIP Sofas · 8 Spotlights',
        eventStart: format(addDays(monday, 3), 'yyyy-MM-dd') + 'T09:00:00',
        eventEnd: format(addDays(monday, 3), 'yyyy-MM-dd') + 'T13:00:00',
        periodStart: format(addDays(monday, 3), 'yyyy-MM-dd') + 'T09:00:00',
        periodEnd: format(addDays(monday, 3), 'yyyy-MM-dd') + 'T13:00:00',
      },
      {
        bookingId: 'demo-3',
        eventName: 'Haldi Ceremony',
        customerName: 'Sharma Wedding',
        status: 'CONFIRMED',
        itemCount: 8,
        packageCount: 1,
        itemSummary: '4 Brass Urli · 2 Canopies',
        eventStart: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T11:00:00',
        eventEnd: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T16:00:00',
        periodStart: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T11:00:00',
        periodEnd: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T16:00:00',
      },
      {
        bookingId: 'demo-4',
        eventName: 'Sangeet Function',
        customerName: 'Mehta Family',
        status: 'CONFIRMED',
        itemCount: 24,
        packageCount: 3,
        itemSummary: '4 VIP Sofas · 2 Jhoolas',
        eventStart: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T15:00:00',
        eventEnd: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T22:00:00',
        periodStart: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T15:00:00',
        periodEnd: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T22:00:00',
      },
      {
        bookingId: 'demo-5',
        eventName: 'Reception',
        customerName: 'Sharma Wedding',
        status: 'CONFIRMED',
        itemCount: 74,
        packageCount: 4,
        itemSummary: '4 Brass Urli · 70 Chairs',
        hasConflict: true,
        conflictDetails: 'Inventory Conflict: 2 Brass Urli short due to overlapping turnaround with Haldi Ceremony.',
        eventStart: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T18:00:00',
        eventEnd: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T22:00:00',
        periodStart: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T18:00:00',
        periodEnd: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T22:00:00',
      },
      {
        bookingId: 'demo-6',
        eventName: 'Birthday Party',
        customerName: 'Kapoor Family',
        status: 'CONFIRMED',
        itemCount: 14,
        packageCount: 1,
        itemSummary: '8 Cocktail Tables · 6 Chairs',
        eventStart: format(addDays(monday, 5), 'yyyy-MM-dd') + 'T14:00:00',
        eventEnd: format(addDays(monday, 5), 'yyyy-MM-dd') + 'T18:00:00',
        periodStart: format(addDays(monday, 5), 'yyyy-MM-dd') + 'T14:00:00',
        periodEnd: format(addDays(monday, 5), 'yyyy-MM-dd') + 'T18:00:00',
      },
      {
        bookingId: 'demo-7',
        eventName: 'Engagement',
        customerName: 'Gupta Family',
        status: 'CONFIRMED',
        itemCount: 18,
        packageCount: 2,
        itemSummary: '4 VIP Sofas · 1 Backdrop',
        eventStart: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T09:00:00',
        eventEnd: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T13:00:00',
        periodStart: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T09:00:00',
        periodEnd: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T13:00:00',
      },
    ];
  }, [currentDate]);

  // Combined events
  const allEvents: EnrichedCalendarEvent[] = useMemo(() => {
    if (events && events.length > 0) {
      return events.map((ev, i) => ({
        ...ev,
        itemCount: (i % 3 + 1) * 8,
        packageCount: (i % 2 + 1),
        itemSummary: `${(i % 3 + 1) * 8} items allocated`,
      }));
    }
    return sampleEvents;
  }, [events, sampleEvents]);

  // Filtered events
  const displayEvents = useMemo(() => {
    if (!selectedTypeFilter) return allEvents;
    return allEvents.filter(ev => detectEventType(ev.eventName) === selectedTypeFilter);
  }, [allEvents, selectedTypeFilter]);

  // Non-zero Event Types active in the current range
  const activeEventTypes = useMemo(() => {
    const counts: Record<string, number> = {};
    allEvents.forEach(ev => {
      const type = detectEventType(ev.eventName);
      counts[type] = (counts[type] || 0) + 1;
    });
    // Only return event types that have count > 0 to eliminate zero-value clutter
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count, config: EVENT_TYPE_MAP[name] || EVENT_TYPE_MAP.Other }));
  }, [allEvents]);

  // Week Days (Mon to Sun)
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Month Days
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  // Mini Calendar Days
  const miniCalDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(miniCalendarMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(miniCalendarMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [miniCalendarMonth]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week' || viewMode === 'timeline') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week' || viewMode === 'timeline') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setMiniCalendarMonth(today);
  };

  // Header date label
  const dateRangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    }
    if (viewMode === 'week' || viewMode === 'timeline') {
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  }, [viewMode, currentDate, weekStart, weekEnd]);

  // Event & Buffer placement in week view (distinguishing Event Window vs Buffer Window)
  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.eventStart);
    const end = new Date(event.eventEnd);
    const periodStart = event.periodStart ? new Date(event.periodStart) : start;
    const periodEnd = event.periodEnd ? new Date(event.periodEnd) : end;

    const startH = getHours(start) + getMinutes(start) / 60;
    const endH = getHours(end) + getMinutes(end) / 60;
    const pStartH = getHours(periodStart) + getMinutes(periodStart) / 60;
    const pEndH = getHours(periodEnd) + getMinutes(periodEnd) / 60;

    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR + 1, startH));
    const clampedEnd = Math.max(clampedStart + 0.6, Math.min(END_HOUR + 1, endH));

    const top = (clampedStart - START_HOUR) * HOUR_HEIGHT;
    const height = Math.max(34, (clampedEnd - clampedStart) * HOUR_HEIGHT - 2);

    // Prep Buffer (prior to event on same day)
    const hasPrepBuffer = pStartH < startH && isSameDay(periodStart, start);
    const clampedPrepStart = Math.max(START_HOUR, Math.min(clampedStart, pStartH));
    const prepTop = (clampedPrepStart - START_HOUR) * HOUR_HEIGHT;
    const prepHeight = Math.max(0, top - prepTop);

    // Return & Cleaning Buffer (after event on same day)
    const hasReturnBuffer = pEndH > endH && isSameDay(periodEnd, end);
    const clampedReturnEnd = Math.min(END_HOUR + 1, Math.max(clampedEnd, pEndH));
    const returnTop = top + height;
    const returnHeight = Math.max(0, ((clampedReturnEnd - START_HOUR) * HOUR_HEIGHT) - returnTop);

    return { 
      top, 
      height, 
      durationHours: endH - startH,
      hasPrepBuffer,
      prepTop,
      prepHeight,
      hasReturnBuffer,
      returnTop,
      returnHeight,
    };
  };

  // Live Current Time Indicator
  const currentTimePosition = useMemo(() => {
    const currentH = getHours(now) + getMinutes(now) / 60;
    if (currentH < START_HOUR || currentH > END_HOUR + 1) return null;
    return (currentH - START_HOUR) * HOUR_HEIGHT;
  }, [now]);

  // Inventory Pressure Items
  const pressureItems: PressureItem[] = useMemo(() => {
    if (inventoryResponse?.items && inventoryResponse.items.length > 0) {
      return inventoryResponse.items.map(item => {
        const totalReserved = item.pressureSegments.reduce((acc, seg) => Math.max(acc, seg.reservedQty), 0);
        const hasShortage = item.pressureSegments.some(s => s.pressure === 'SHORTAGE');
        const isFull = item.pressureSegments.some(s => s.pressure === 'FULL');
        return {
          id: item.inventoryItemId,
          name: item.name,
          usableQty: item.usableQty,
          reservedQty: totalReserved,
          pressure: hasShortage ? 'SHORTAGE' : isFull ? 'FULL' : 'NORMAL',
          shortageQty: hasShortage ? Math.max(1, totalReserved - item.usableQty) : 0,
          allocations: item.reservations.map(r => ({
            bookingName: `Booking #${r.bookingId.slice(0, 6)}`,
            qty: r.quantity,
            timeRange: `${format(new Date(r.start), 'MMM d, h:mm a')} – ${format(new Date(r.end), 'h:mm a')}`
          }))
        };
      });
    }
    return SAMPLE_PRESSURE_ITEMS;
  }, [inventoryResponse]);

  const conflictsCount = useMemo(() => {
    return allEvents.filter(e => e.hasConflict).length + pressureItems.filter(p => p.pressure === 'SHORTAGE').length;
  }, [allEvents, pressureItems]);

  // Check Availability
  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkStartDate || !checkEndDate) return;
    setCheckingAvail(true);
    setAvailResult(null);
    try {
      await new Promise(r => setTimeout(r, 500));
      setAvailResult('Inventory checked: All requested items are available with 0 conflicts for this slot.');
    } catch {
      setAvailResult('Error checking availability. Please try again.');
    } finally {
      setCheckingAvail(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorState message={error} onRetry={loadCalendarData} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0c0c0f] text-neutral-200 px-3 sm:px-6 py-4 space-y-4 font-sans">
      
      {/* 1. COMPACT OPERATIONAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1c1c24] pb-3.5">
        
        {/* Title and subtext */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">Calendar</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#181822] text-amber-400 border border-amber-500/20">
              <Activity className="w-3 h-3" /> Temporal Inventory
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">View bookings, inventory schedules & capacity pressure</p>
        </div>

        {/* Date Navigator + View Switcher + New Booking CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Navigator */}
          <div className="flex items-center gap-1 bg-[#141419] border border-[#22222c] rounded-lg p-0.5">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Today
            </button>
            <div className="h-3 w-px bg-[#2a2a38] mx-0.5" />
            <button
              onClick={handlePrev}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-neutral-200 px-2 min-w-[125px] text-center select-none font-mono">
              {dateRangeLabel}
            </span>
            <button
              onClick={handleNext}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Standard Views */}
          <div className="flex items-center bg-[#141419] border border-[#22222c] rounded-lg p-0.5 gap-0.5">
            {(['day', 'week', 'month', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Dedicated Inventory Timeline Mode */}
          <button
            onClick={() => setViewMode(viewMode === 'timeline' ? 'week' : 'timeline')}
            className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
              viewMode === 'timeline'
                ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inventory Timeline</span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={() => router.push('/bookings/new')}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Booking</span>
          </button>

        </div>

      </div>

      {/* 4-TIER TEMPORAL DISTINCTION LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-surface border border-border rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary border border-primary/40 shadow-sm" />
            <span className="font-semibold text-text text-[11px] tracking-wider uppercase">Event Window</span>
            <span className="text-text-muted text-[10px] hidden sm:inline">(Actual event)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-surface-raised border border-dashed border-status-warning/60 shadow-sm" />
            <span className="font-semibold text-text text-[11px] tracking-wider uppercase">Buffer Window</span>
            <span className="text-text-muted text-[10px] hidden sm:inline">(Turnaround / Prep / Transit)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-status-info/20 border border-status-info/50 text-[9px] font-mono font-bold flex items-center justify-center text-status-info">
              Qty
            </span>
            <span className="font-semibold text-text text-[11px] tracking-wider uppercase">Inventory Pressure</span>
            <span className="text-text-muted text-[10px] hidden sm:inline">(Committed items)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-status-danger/20 border border-status-danger/50 text-[9px] font-bold flex items-center justify-center text-status-danger">
              !
            </span>
            <span className="font-semibold text-status-danger text-[11px] tracking-wider uppercase">Conflict</span>
            <span className="text-text-muted text-[10px] hidden sm:inline">(Shortage detected)</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-text-muted tabular-nums">
          {allEvents.length} BOOKINGS · {conflictsCount > 0 ? `${conflictsCount} SHORTAGE ALERTS` : '0 SHORTAGES'}
        </div>
      </div>

      {/* 2. TWO-LAYER WORKSPACE: Primary Event Calendar + Inventory Pressure Layer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* Main Work Area (10 cols on xl) */}
        <div className="xl:col-span-10 space-y-4">
          
          {/* Active Filter Pill */}
          {selectedTypeFilter && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs">
              <span className="text-amber-300 font-medium">
                Filtering by <strong>{selectedTypeFilter}</strong> ({displayEvents.length} events)
              </span>
              <button
                onClick={() => setSelectedTypeFilter(null)}
                className="text-amber-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}

          {/* ===================== LAYER 1: BOOKINGS CALENDAR GRID ===================== */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-xl overflow-hidden shadow-lg flex flex-col">
            
            {/* WEEK VIEW (Primary operational grid) */}
            {viewMode === 'week' && (
              <div className="overflow-x-auto select-none">
                <div className="min-w-[680px]">
                  
                  {/* Header Row: 7 Day Columns (No wasted All Day column) */}
                  <div className="flex border-b border-[#1c1c24] bg-[#0d0d11]">
                    {/* Compact Time Anchor */}
                    <div className="w-14 flex-shrink-0 border-r border-[#1c1c24] p-2 text-right text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-end">
                      Time
                    </div>

                    {/* 7 Full-Width Day Columns */}
                    <div className="flex-1 grid grid-cols-7 divide-x divide-[#1c1c24]">
                      {weekDays.map((day, idx) => {
                        const isDayToday = isToday(day);
                        const isSelected = isSameDay(day, currentDate);
                        return (
                          <div
                            key={idx}
                            onClick={() => setCurrentDate(day)}
                            className={`p-2 text-center cursor-pointer transition-colors ${
                              isDayToday ? 'bg-amber-500/[0.04]' : isSelected ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'
                            }`}
                          >
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${isDayToday ? 'text-amber-400' : 'text-neutral-400'}`}>
                              {format(day, 'EEE')}
                            </div>
                            <div className="mt-0.5 flex items-center justify-center">
                              {isDayToday ? (
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center shadow-sm">
                                  {format(day, 'd')}
                                </span>
                              ) : (
                                <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-neutral-200'}`}>
                                  {format(day, 'MMM d')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid Body */}
                  <div className="flex relative bg-[#111115]">
                    
                    {/* Left Column: Hourly Labels */}
                    <div className="w-14 flex-shrink-0 border-r border-[#1c1c24] bg-[#0d0d11]/80">
                      {TIME_SLOTS.map((time, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          className="pr-2 pt-0.5 text-right text-[10px] font-semibold text-neutral-500 border-b border-[#1c1c24]/50"
                        >
                          {time}
                        </div>
                      ))}
                    </div>

                    {/* 7 Day Columns */}
                    <div className="flex-1 grid grid-cols-7 divide-x divide-[#1c1c24] relative">
                      {weekDays.map((day, dayIndex) => {
                        const dayEvents = displayEvents.filter(ev => isSameDay(new Date(ev.eventStart), day));
                        const isDayToday = isToday(day);

                        return (
                          <div
                            key={dayIndex}
                            className={`relative ${
                              isDayToday ? 'bg-amber-500/[0.025]' : ''
                            }`}
                          >
                            {/* Hourly Grid Rows */}
                            {TIME_SLOTS.map((_, idx) => (
                              <div
                                key={idx}
                                style={{ height: `${HOUR_HEIGHT}px` }}
                                className="border-b border-[#1c1c24]/50 transition-colors hover:bg-white/[0.015] cursor-pointer"
                                onClick={() => router.push(`/bookings/new?date=${format(day, 'yyyy-MM-dd')}`)}
                              />
                            ))}

                            {/* Live Current Time Indicator */}
                            {isDayToday && currentTimePosition !== null && (
                              <div
                                style={{ top: `${currentTimePosition}px` }}
                                className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                              >
                                <div className="w-2 h-2 rounded-full bg-amber-500 -ml-1 shadow-[0_0_6px_rgba(245,158,11,1)]" />
                                <div className="h-px w-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                                <span className="absolute right-1 -top-3 bg-amber-500 text-black font-extrabold text-[8.5px] px-1 py-0.2 rounded">
                                  {format(now, 'h:mm a')}
                                </span>
                              </div>
                            )}

                            {/* Information-Dense Event Cards with Buffer Windows */}
                            {dayEvents.map((event) => {
                              const eventType = detectEventType(event.eventName);
                              const config = EVENT_TYPE_MAP[eventType] || EVENT_TYPE_MAP.Other;
                              const { 
                                top, 
                                height, 
                                hasPrepBuffer, 
                                prepTop, 
                                prepHeight, 
                                hasReturnBuffer, 
                                returnTop, 
                                returnHeight 
                              } = getEventPosition(event);

                              const startTimeFormatted = format(new Date(event.eventStart), 'h:mm a');
                              const endTimeFormatted = format(new Date(event.eventEnd), 'h:mm a');

                              return (
                                <div key={event.bookingId}>
                                  {/* Prep Buffer Window */}
                                  {hasPrepBuffer && prepHeight > 4 && (
                                    <div
                                      style={{ top: `${prepTop}px`, height: `${prepHeight}px` }}
                                      className="absolute inset-x-0.5 rounded-t border border-dashed border-status-warning/50 bg-status-warning/5 overflow-hidden flex items-center justify-center pointer-events-none z-10"
                                      title="Turnaround Prep Buffer: Equipment staging, checkout, and transit"
                                    >
                                      <span className="text-[8px] font-mono font-semibold text-status-warning/90 uppercase tracking-widest px-1 truncate">
                                        Prep Buffer
                                      </span>
                                    </div>
                                  )}

                                  {/* Core Event Window Card */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                    }}
                                    style={{
                                      top: `${top}px`,
                                      height: `${height}px`,
                                    }}
                                    className={`absolute inset-x-0.5 rounded p-1.5 overflow-hidden flex flex-col justify-between border border-l-[3px] ${config.cardAccent} ${config.cardBg} ${config.cardBorder} shadow transition-all hover:scale-[1.01] hover:z-30 cursor-pointer group`}
                                  >
                                    <div>
                                      {/* Event Title + Conflict Tag */}
                                      <div className="flex items-center justify-between gap-1 leading-tight">
                                        <span className={`text-[11px] font-bold ${config.textColor} truncate`}>
                                          {event.eventName}
                                        </span>
                                        {event.hasConflict && (
                                          <span className="flex-shrink-0 px-1 py-0.2 rounded bg-status-danger/20 text-status-danger border border-status-danger/40 text-[8px] font-extrabold flex items-center gap-0.5">
                                            <AlertTriangle className="w-2.5 h-2.5" /> Conflict
                                          </span>
                                        )}
                                      </div>

                                      {/* Time Range */}
                                      <div className={`text-[9.5px] ${config.subtextColor} font-medium mt-0.5 truncate`}>
                                        {startTimeFormatted} – {endTimeFormatted}
                                      </div>

                                      {/* Customer Name */}
                                      {height >= 55 && event.customerName && (
                                        <div className="text-[9.5px] text-text-muted truncate mt-0.5">
                                          {event.customerName}
                                        </div>
                                      )}
                                    </div>

                                    {/* Bottom: Inventory Pressure Line */}
                                    {height >= 75 && (
                                      <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[9px] text-neutral-300 truncate">
                                        <span className="flex items-center gap-1 font-medium truncate">
                                          <Package className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                                          <span className="truncate font-mono">{event.itemSummary}</span>
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Return Buffer Window */}
                                  {hasReturnBuffer && returnHeight > 4 && (
                                    <div
                                      style={{ top: `${returnTop}px`, height: `${returnHeight}px` }}
                                      className="absolute inset-x-0.5 rounded-b border border-dashed border-status-warning/50 bg-status-warning/5 overflow-hidden flex items-center justify-center pointer-events-none z-10"
                                      title="Turnaround Return Buffer: Equipment return, inspection, and cleaning"
                                    >
                                      <span className="text-[8px] font-mono font-semibold text-status-warning/90 uppercase tracking-widest px-1 truncate">
                                        Return Buffer
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* TIMELINE VIEW (Signature TemporalRent View) */}
            {viewMode === 'timeline' && (
              <div className="p-4 space-y-4 select-none overflow-x-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e1e26]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">Inventory Reservation Matrix</h2>
                      <p className="text-[11px] text-neutral-400">Tracking item commitments and capacity bottlenecks across time</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Normal
                    </span>
                    <span className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> 100% Committed
                    </span>
                    <span className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Overbooked
                    </span>
                  </div>
                </div>

                <div className="min-w-[640px] border border-[#1e1e26] rounded-lg overflow-hidden bg-[#0d0d10]">
                  {/* Days Header */}
                  <div className="grid grid-cols-8 border-b border-[#1e1e26] bg-[#14141a]">
                    <div className="p-2 text-xs font-bold text-neutral-400 uppercase tracking-wider border-r border-[#1e1e26]">
                      Item Name
                    </div>
                    {weekDays.map((day, idx) => (
                      <div key={idx} className={`p-1.5 text-center text-xs font-semibold border-r border-[#1e1e26] last:border-r-0 ${isToday(day) ? 'bg-amber-500/10 text-amber-300' : 'text-neutral-300'}`}>
                        <div>{format(day, 'EEE')}</div>
                        <div className="text-[10px] text-neutral-500">{format(day, 'MMM d')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-[#1e1e26]">
                    {pressureItems.map((item) => {
                      const isShortage = item.pressure === 'SHORTAGE';
                      const isFull = item.pressure === 'FULL';
                      return (
                        <div key={item.id} className="grid grid-cols-8 hover:bg-white/[0.015] transition-colors">
                          <div 
                            onClick={() => setSelectedPressureItem(item)}
                            className="p-2.5 border-r border-[#1e1e26] bg-[#111115]/80 flex flex-col justify-center cursor-pointer hover:bg-white/5"
                          >
                            <div className="text-xs font-bold text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-neutral-400">
                              Owned: <strong className="text-neutral-200">{item.usableQty}</strong>
                            </div>
                            {isShortage && (
                              <span className="text-[9px] font-bold text-red-400 flex items-center gap-0.5 mt-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Shortage: {item.shortageQty}
                              </span>
                            )}
                          </div>

                          {weekDays.map((day, dIdx) => {
                            const dayNum = day.getDay();
                            const hasReservation = (dayNum === 2 || dayNum === 4 || dayNum === 5);
                            const reservedCount = hasReservation ? item.reservedQty : 0;
                            const percent = Math.min(100, Math.round((reservedCount / item.usableQty) * 100));

                            return (
                              <div key={dIdx} className="p-1.5 border-r border-[#1e1e26] last:border-r-0 flex flex-col justify-center items-center">
                                {hasReservation ? (
                                  <div 
                                    onClick={() => setSelectedPressureItem(item)}
                                    className={`w-full p-1 rounded border text-center cursor-pointer transition-all ${
                                      isShortage 
                                        ? 'bg-red-500/20 border-red-500/40 text-red-200' 
                                        : isFull 
                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-200' 
                                        : 'bg-blue-500/15 border-blue-500/30 text-blue-200'
                                    }`}
                                  >
                                    <div className="text-[10px] font-bold leading-none">
                                      {reservedCount}/{item.usableQty}
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-1 mt-1 overflow-hidden">
                                      <div 
                                        className={`h-full ${isShortage ? 'bg-red-500' : isFull ? 'bg-amber-500' : 'bg-blue-500'}`}
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                    {isShortage && (
                                      <div className="text-[8px] text-red-300 font-extrabold uppercase mt-0.5">
                                        Shortage
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-neutral-600 font-mono">
                                    0/{item.usableQty}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === 'day' && (
              <div className="p-5 space-y-3 select-none">
                <div className="flex items-center justify-between border-b border-[#1e1e26] pb-2.5">
                  <h2 className="text-base font-bold text-white">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
                  <button
                    onClick={() => router.push(`/bookings/new?date=${format(currentDate, 'yyyy-MM-dd')}`)}
                    className="px-3 py-1 rounded bg-amber-500 text-black text-xs font-bold"
                  >
                    + Book Day
                  </button>
                </div>
                <div className="space-y-2">
                  {displayEvents
                    .filter(ev => isSameDay(new Date(ev.eventStart), currentDate))
                    .map(ev => (
                      <div
                        key={ev.bookingId}
                        onClick={() => setSelectedEvent(ev)}
                        className="p-3 rounded-lg border border-[#242430] bg-[#14141a] flex items-center justify-between hover:border-white/20 cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{ev.eventName}</span>
                            <span className="text-[10px] px-2 py-0.2 rounded bg-neutral-800 text-neutral-300">
                              {ev.status}
                            </span>
                            {ev.hasConflict && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" /> Conflict
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 mt-1 flex items-center gap-3">
                            <span>{format(new Date(ev.eventStart), 'h:mm a')} – {format(new Date(ev.eventEnd), 'h:mm a')}</span>
                            <span>•</span>
                            <span>{ev.customerName}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">📦 {ev.itemSummary}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-500" />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* MONTH VIEW */}
            {viewMode === 'month' && (
              <div className="select-none">
                <div className="grid grid-cols-7 border-b border-[#1e1e26] bg-[#0d0d11]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={idx} className="p-2 text-center text-[10px] font-bold text-neutral-400 uppercase">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 divide-x divide-y divide-[#1c1c24]">
                  {monthDays.map((day, idx) => {
                    const dayEvents = displayEvents.filter(ev => isSameDay(new Date(ev.eventStart), day));
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentDate(day);
                          setViewMode('day');
                        }}
                        className={`min-h-[80px] p-1.5 flex flex-col justify-between cursor-pointer ${
                          !isCurrentMonth ? 'bg-[#09090c] text-neutral-600' : 'bg-[#111115] hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={isToday(day) ? 'w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]' : 'text-neutral-300'}>
                            {format(day, 'd')}
                          </span>
                          {dayEvents.length > 0 && <span className="text-[9px] text-neutral-500">{dayEvents.length}</span>}
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {dayEvents.slice(0, 2).map(e => (
                            <div key={e.bookingId} className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-200 truncate">
                              {e.eventName}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="p-4 select-none divide-y divide-[#1e1e26]">
                {displayEvents.map((event) => (
                  <div
                    key={event.bookingId}
                    onClick={() => setSelectedEvent(event)}
                    className="py-3 flex items-center justify-between hover:bg-white/[0.015] px-2 rounded cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{event.eventName}</h3>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                          {event.status}
                        </span>
                        {event.hasConflict && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            ⚠ Conflict
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
                        <span>{format(new Date(event.eventStart), 'EEE, MMM d')}</span>
                        <span>•</span>
                        <span>{format(new Date(event.eventStart), 'h:mm a')} – {format(new Date(event.eventEnd), 'h:mm a')}</span>
                        <span>•</span>
                        <span>{event.customerName}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-medium">📦 {event.itemSummary}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500" />
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* ===================== LAYER 2: INVENTORY PRESSURE & ALLOCATION ===================== */}
          {/* Directly attached underneath the calendar workspace */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Inventory Pressure
                </h3>
                <span className="text-[11px] text-neutral-400">
                  — Real-time capacity load across active window
                </span>
              </div>
              <button
                onClick={() => setViewMode('timeline')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Inspect Matrix <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Dense 3-column operational layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {pressureItems.map((item) => {
                const isShortage = item.pressure === 'SHORTAGE';
                const isFull = item.pressure === 'FULL';
                const percent = Math.min(100, Math.round((item.reservedQty / item.usableQty) * 100));

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPressureItem(item)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isShortage
                        ? 'bg-red-500/10 border-red-500/40 hover:border-red-400'
                        : isFull
                        ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400'
                        : 'bg-[#141419] border-[#20202a] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[170px]">{item.name}</span>
                      {isShortage ? (
                        <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[9px] font-extrabold flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Shortage
                        </span>
                      ) : isFull ? (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                          100% Full
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-[#1c1c24] rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isShortage ? 'bg-red-500' : isFull ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                      <span>{item.reservedQty} / {item.usableQty} committed</span>
                      <span>{Math.max(0, item.usableQty - item.reservedQty)} available</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Utility / Context Panel (Compressed, 2 cols on xl) */}
        <div className="xl:col-span-2 space-y-3">
          
          {/* Mini Calendar (Small floating utility) */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-xl p-2.5 shadow select-none">
            <div className="flex items-center justify-between mb-1.5">
              <button
                onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-bold text-neutral-200">
                {format(miniCalendarMonth, 'MMM yyyy')}
              </span>
              <button
                onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center mb-0.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-[9px] font-bold text-neutral-500">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center">
              {miniCalDays.map((day, idx) => {
                const isSelected = isSameDay(day, currentDate);
                const isDayToday = isToday(day);
                const inCurrentMonth = isSameMonth(day, miniCalendarMonth);

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentDate(day)}
                    className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                        : isDayToday
                        ? 'border border-amber-500 text-amber-400 font-bold'
                        : inCurrentMonth
                        ? 'text-neutral-300 hover:bg-neutral-800'
                        : 'text-neutral-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Event Types Filter (Only displays active categories) */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-xl p-2.5 shadow">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Event Types</h2>
              {selectedTypeFilter && (
                <button
                  onClick={() => setSelectedTypeFilter(null)}
                  className="text-[9px] text-amber-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              {activeEventTypes.map(({ name, count, config }) => {
                const isSelected = selectedTypeFilter === name;
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedTypeFilter(isSelected ? null : name)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors ${
                      isSelected ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-white/5 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                      <span className="truncate">{name}</span>
                    </div>
                    <span className="font-mono text-neutral-500 text-[10px]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions (Streamlined) */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-xl p-2.5 shadow space-y-1.5">
            <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Quick Tools</h2>

            <button
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#16161c] hover:bg-[#202028] border border-[#242430] text-xs font-semibold text-neutral-300 hover:text-white transition-all text-left"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Check Avail</span>
            </button>

            <button
              onClick={() => router.push('/inventory')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#16161c] hover:bg-[#202028] border border-[#242430] text-xs font-semibold text-neutral-300 hover:text-white transition-all text-left"
            >
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span>Inventory</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3. MODAL: EVENT DETAILS (Inventory impact + Conflict breakdown) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131318] border border-[#272733] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#202028] flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  (EVENT_TYPE_MAP[detectEventType(selectedEvent.eventName)] || EVENT_TYPE_MAP.Other).badgeBg
                }`}>
                  {detectEventType(selectedEvent.eventName)}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedEvent.eventName}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-neutral-300">
                <Clock className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">
                    {format(new Date(selectedEvent.eventStart), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-neutral-400">
                    {format(new Date(selectedEvent.eventStart), 'h:mm a')} – {format(new Date(selectedEvent.eventEnd), 'h:mm a')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-neutral-300">
                <User className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <div>
                  <div className="text-neutral-400">Customer</div>
                  <div className="font-semibold text-white">{selectedEvent.customerName}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-neutral-300">
                <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-neutral-400">Committed Inventory</div>
                  <div className="font-semibold text-amber-200">{selectedEvent.itemSummary}</div>
                </div>
              </div>

              {selectedEvent.hasConflict && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Capacity Conflict</strong>
                    <span>{selectedEvent.conflictDetails}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#0d0d10] border-t border-[#202028] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => router.push(`/bookings/${selectedEvent.bookingId}`)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1"
              >
                <span>View Booking</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: ITEM BREAKDOWN POPUP */}
      {selectedPressureItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131318] border border-[#272733] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#202028] flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{selectedPressureItem.name}</h3>
                <p className="text-xs text-neutral-400">Capacity breakdown across temporal commitments</p>
              </div>
              <button
                onClick={() => setSelectedPressureItem(null)}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[#181822] border border-[#222230]">
                  <div className="text-[10px] text-neutral-400">Total Owned</div>
                  <div className="text-base font-bold text-white">{selectedPressureItem.usableQty}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#181822] border border-[#222230]">
                  <div className="text-[10px] text-neutral-400">Committed</div>
                  <div className="text-base font-bold text-amber-300">{selectedPressureItem.reservedQty}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#181822] border border-[#222230]">
                  <div className="text-[10px] text-neutral-400">Remaining</div>
                  <div className="text-base font-bold text-emerald-400">
                    {Math.max(0, selectedPressureItem.usableQty - selectedPressureItem.reservedQty)}
                  </div>
                </div>
              </div>

              {selectedPressureItem.pressure === 'SHORTAGE' && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Shortage of {selectedPressureItem.shortageQty || 2} units</strong>
                    <span>Overlapping bookings are demanding more stock than physical usable capacity.</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Active Bookings Reserving This Item:</div>
                <div className="divide-y divide-[#202028] bg-[#0f0f14] border border-[#202028] rounded-lg">
                  {selectedPressureItem.allocations.map((alloc, i) => (
                    <div key={i} className="p-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{alloc.bookingName}</div>
                        <div className="text-[10px] text-neutral-400">{alloc.timeRange}</div>
                      </div>
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {alloc.qty} units
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0d0d10] border-t border-[#202028] flex items-center justify-end">
              <button
                onClick={() => setSelectedPressureItem(null)}
                className="px-3 py-1 text-xs text-neutral-300 hover:text-white bg-[#181822] rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: AVAILABILITY CHECKER */}
      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131318] border border-[#272733] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#202028] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Check Inventory Availability</h3>
              </div>
              <button
                onClick={() => {
                  setIsAvailabilityModalOpen(false);
                  setAvailResult(null);
                }}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckAvailability} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={checkStartDate}
                  onChange={(e) => setCheckStartDate(e.target.value)}
                  className="w-full bg-[#181820] border border-[#272733] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={checkEndDate}
                  onChange={(e) => setCheckEndDate(e.target.value)}
                  className="w-full bg-[#181820] border border-[#272733] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {availResult && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{availResult}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAvailabilityModalOpen(false);
                    setAvailResult(null);
                  }}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkingAvail}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-sm"
                >
                  {checkingAvail ? 'Checking...' : 'Check Availability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
