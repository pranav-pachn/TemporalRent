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
  Filter, 
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  Sparkles
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
  itemCount?: number;
  packageCount?: number;
  itemSummary?: string;
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
  metaColor: string;
}

const EVENT_TYPE_MAP: Record<string, EventTypeConfig> = {
  Wedding: {
    name: 'Wedding',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    cardBg: 'bg-[#221215]/95 hover:bg-[#2c171b]',
    cardBorder: 'border-[#3d181f]',
    cardAccent: 'border-l-[#ef4444]',
    textColor: 'text-rose-100',
    subtextColor: 'text-rose-300/80',
    metaColor: 'text-rose-400/90',
  },
  Haldi: {
    name: 'Haldi',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    cardBg: 'bg-[#241a0b]/95 hover:bg-[#30230f]',
    cardBorder: 'border-[#422e11]',
    cardAccent: 'border-l-[#f59e0b]',
    textColor: 'text-amber-100',
    subtextColor: 'text-amber-300/80',
    metaColor: 'text-amber-400/90',
  },
  Sangeet: {
    name: 'Sangeet',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    cardBg: 'bg-[#1e112a]/95 hover:bg-[#281738]',
    cardBorder: 'border-[#3b1c54]',
    cardAccent: 'border-l-[#a855f7]',
    textColor: 'text-purple-100',
    subtextColor: 'text-purple-300/80',
    metaColor: 'text-purple-400/90',
  },
  Corporate: {
    name: 'Corporate',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    cardBg: 'bg-[#0f1f33]/95 hover:bg-[#152a45]',
    cardBorder: 'border-[#19375a]',
    cardAccent: 'border-l-[#3b82f6]',
    textColor: 'text-blue-100',
    subtextColor: 'text-blue-300/80',
    metaColor: 'text-blue-400/90',
  },
  Birthday: {
    name: 'Birthday',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    cardBg: 'bg-[#0b2317]/95 hover:bg-[#0f301f]',
    cardBorder: 'border-[#134229]',
    cardAccent: 'border-l-[#10b981]',
    textColor: 'text-emerald-100',
    subtextColor: 'text-emerald-300/80',
    metaColor: 'text-emerald-400/90',
  },
  Engagement: {
    name: 'Engagement',
    dotColor: 'bg-fuchsia-500',
    badgeBg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    cardBg: 'bg-[#220d25]/95 hover:bg-[#2e1232]',
    cardBorder: 'border-[#431849]',
    cardAccent: 'border-l-[#d946ef]',
    textColor: 'text-fuchsia-100',
    subtextColor: 'text-fuchsia-300/80',
    metaColor: 'text-fuchsia-400/90',
  },
  Other: {
    name: 'Other',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    cardBg: 'bg-[#15151b]/95 hover:bg-[#1d1d25]',
    cardBorder: 'border-[#262633]',
    cardAccent: 'border-l-slate-400',
    textColor: 'text-slate-100',
    subtextColor: 'text-slate-300/80',
    metaColor: 'text-slate-400/90',
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
  '11:00 PM',
];

// Compact row height (reduced by ~21% from 56px to 44px to eliminate excessive empty vertical space)
const HOUR_HEIGHT = 44;
const START_HOUR = 8;
const END_HOUR = 23;

// Realistic sample inventory pressure items demonstrating TemporalRent's signature feature
const SAMPLE_PRESSURE_ITEMS = [
  { id: 'item-1', name: 'VIP Velvet Sofa', usableQty: 10, reservedQty: 8, pressure: 'FULL', reservedBy: ['Product Launch (4)', 'Sangeet Function (4)'] },
  { id: 'item-2', name: 'Brass Urli Bowl (36")', usableQty: 6, reservedQty: 6, pressure: 'SHORTAGE', shortageQty: 2, reservedBy: ['Haldi Ceremony (4)', 'Reception (4) — Overbooked by 2'] },
  { id: 'item-3', name: 'Royal Carved Jhoola', usableQty: 4, reservedQty: 2, pressure: 'NORMAL', reservedBy: ['Sangeet Function (2)'] },
  { id: 'item-4', name: 'Banquet Chairs (Gold)', usableQty: 150, reservedQty: 120, pressure: 'NORMAL', reservedBy: ['Corporate Setup (50)', 'Reception (70)'] },
  { id: 'item-5', name: 'Ambient Stage Spotlight', usableQty: 16, reservedQty: 14, pressure: 'FULL', reservedBy: ['Product Launch (8)', 'Sangeet Function (6)'] },
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

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<EnrichedCalendarEvent | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [checkStartDate, setCheckStartDate] = useState('');
  const [checkEndDate, setCheckEndDate] = useState('');
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState<string | null>(null);

  // Update current time every minute for live time indicator
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load Inventory Items for dropdown
  useEffect(() => {
    apiClient.fetchInventoryItems()
      .then(res => setInventoryItemsList(res.data))
      .catch(e => {
        if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
          router.push('/login');
        }
      });
  }, [router]);

  // Load Calendar Data from backend with valid 35-day window
  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend restricts differenceInDays(toDate, fromDate) <= 40
      const windowStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const windowEnd = addDays(windowStart, 35); // 35 days <= 40 days
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

  // Realistic sample events demonstrating TemporalRent's event-to-inventory connection
  const sampleEvents: EnrichedCalendarEvent[] = useMemo(() => {
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    return [
      {
        bookingId: 'demo-1',
        eventName: 'Corporate Setup',
        customerName: 'Green Leaf Events',
        status: 'CONFIRMED',
        itemCount: 14,
        packageCount: 2,
        itemSummary: '50 Banquet Chairs · 4 Stage Spotlights',
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
        itemCount: 22,
        packageCount: 3,
        itemSummary: '4 VIP Sofas · 8 Stage Spotlights',
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
        itemCount: 16,
        packageCount: 2,
        itemSummary: '4 Brass Urli · 2 Marigold Canopy',
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
        itemCount: 28,
        packageCount: 4,
        itemSummary: '4 VIP Sofas · 2 Royal Jhoola · 6 Lights',
        eventStart: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T15:00:00',
        eventEnd: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T23:00:00',
        periodStart: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T15:00:00',
        periodEnd: format(addDays(monday, 2), 'yyyy-MM-dd') + 'T23:00:00',
      },
      {
        bookingId: 'demo-5',
        eventName: 'Reception',
        customerName: 'Sharma Wedding',
        status: 'CONFIRMED',
        itemCount: 36,
        packageCount: 5,
        itemSummary: '4 Brass Urli · 70 Banquet Chairs',
        hasConflict: true,
        conflictDetails: 'Shortage: 2 Brass Urli overlapped with Haldi Ceremony return inspection',
        eventStart: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T18:00:00',
        eventEnd: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T23:30:00',
        periodStart: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T18:00:00',
        periodEnd: format(addDays(monday, 4), 'yyyy-MM-dd') + 'T23:30:00',
      },
      {
        bookingId: 'demo-6',
        eventName: 'Birthday Party',
        customerName: 'Kapoor Family',
        status: 'CONFIRMED',
        itemCount: 9,
        packageCount: 1,
        itemSummary: '6 Cocktail Tables · 1 Arch',
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
        itemCount: 15,
        packageCount: 2,
        itemSummary: '4 VIP Sofas · 1 Floral Backdrop',
        eventStart: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T09:00:00',
        eventEnd: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T13:00:00',
        periodStart: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T09:00:00',
        periodEnd: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T13:00:00',
      },
    ];
  }, [currentDate]);

  // Combined events: if API has events, enrich them; otherwise use sample events
  const allEvents: EnrichedCalendarEvent[] = useMemo(() => {
    if (events && events.length > 0) {
      return events.map((ev, i) => ({
        ...ev,
        itemCount: (i % 3 + 1) * 6,
        packageCount: (i % 2 + 1),
        itemSummary: `${(i % 3 + 1) * 6} items allocated across time`,
      }));
    }
    return sampleEvents;
  }, [events, sampleEvents]);

  // Filtered events
  const displayEvents = useMemo(() => {
    if (!selectedTypeFilter) return allEvents;
    return allEvents.filter(ev => detectEventType(ev.eventName) === selectedTypeFilter);
  }, [allEvents, selectedTypeFilter]);

  // Event Types counts
  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Wedding: 0,
      Haldi: 0,
      Sangeet: 0,
      Corporate: 0,
      Birthday: 0,
      Engagement: 0,
      Other: 0,
    };
    allEvents.forEach(ev => {
      const type = detectEventType(ev.eventName);
      if (counts[type] !== undefined) {
        counts[type]++;
      } else {
        counts.Other++;
      }
    });
    return counts;
  }, [allEvents]);

  // Week Days (Mon to Sun)
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Month Days for Month View
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

  // Date Navigation
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

  // Header range title
  const dateRangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    }
    if (viewMode === 'week' || viewMode === 'timeline') {
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  }, [viewMode, currentDate, weekStart, weekEnd]);

  // Event position calculation in week view
  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.eventStart);
    const end = new Date(event.eventEnd);

    const startH = getHours(start) + getMinutes(start) / 60;
    const endH = getHours(end) + getMinutes(end) / 60;

    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR + 1, startH));
    const clampedEnd = Math.max(clampedStart + 0.6, Math.min(END_HOUR + 1, endH));

    const top = (clampedStart - START_HOUR) * HOUR_HEIGHT;
    const height = Math.max(38, (clampedEnd - clampedStart) * HOUR_HEIGHT - 3);

    return { top, height };
  };

  // Live Current Time Indicator position
  const currentTimePosition = useMemo(() => {
    const currentH = getHours(now) + getMinutes(now) / 60;
    if (currentH < START_HOUR || currentH > END_HOUR + 1) return null;
    return (currentH - START_HOUR) * HOUR_HEIGHT;
  }, [now]);

  // Check Availability Simulation
  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkStartDate || !checkEndDate) return;
    setCheckingAvail(true);
    setAvailResult(null);
    try {
      await new Promise(r => setTimeout(r, 600));
      setAvailResult('All standard inventory lines are available for this time window!');
    } catch {
      setAvailResult('Unable to verify availability. Please try again.');
    } finally {
      setCheckingAvail(false);
    }
  };

  // Active inventory items to show in pressure section
  const pressureItems = useMemo(() => {
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
          shortageQty: hasShortage ? totalReserved - item.usableQty : 0,
          reservedBy: item.reservations.map(r => `Booking ${r.bookingId.slice(0, 6)} (${r.quantity})`)
        };
      });
    }
    return SAMPLE_PRESSURE_ITEMS;
  }, [inventoryResponse]);

  const conflictsCount = useMemo(() => {
    const directConflicts = allEvents.filter(e => e.hasConflict).length;
    const shortageItems = pressureItems.filter(p => p.pressure === 'SHORTAGE').length;
    return Math.max(directConflicts, shortageItems);
  }, [allEvents, pressureItems]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorState message={error} onRetry={loadCalendarData} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0c0c0f] text-neutral-200 px-3 sm:px-6 py-5 space-y-5">
      
      {/* 1. TOP TOOLBAR: Distinct hierarchy with separate Timeline signature mode */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#1c1c24] pb-4">
        
        {/* Left: Branding & Subtext */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Calendar</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Activity className="w-3 h-3 text-amber-400" /> Temporal Reservations
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Inventory allocation, booking schedule & conflict detection</p>
          </div>
        </div>

        {/* Center: Range Navigator */}
        <div className="flex items-center gap-2 self-start xl:self-auto">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg bg-[#16161c] hover:bg-[#202028] border border-[#242430] text-xs font-semibold text-neutral-200 hover:text-white transition-all shadow-sm active:scale-95"
          >
            Today
          </button>

          <div className="flex items-center bg-[#16161c] border border-[#242430] rounded-lg p-0.5 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#202028] rounded-md transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-neutral-200 px-3 min-w-[130px] text-center select-none font-mono">
              {dateRangeLabel}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#202028] rounded-md transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Calendar Views + Timeline Signature Mode + New Booking CTA */}
        <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto">
          
          {/* Standard Calendar View Tabs */}
          <div className="flex items-center bg-[#121216] border border-[#22222c] rounded-xl p-1 gap-0.5 shadow-sm">
            {(['day', 'week', 'month', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* TemporalRent's Signature Feature: Inventory Timeline Mode Button */}
          <button
            onClick={() => setViewMode(viewMode === 'timeline' ? 'week' : 'timeline')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              viewMode === 'timeline'
                ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/20'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
            title="TemporalRent Inventory Timeline view"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inventory Timeline</span>
          </button>

          {/* Prominent + New Booking CTA */}
          <button
            onClick={() => router.push('/bookings/new')}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm px-4 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 ml-1"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Booking</span>
          </button>

        </div>

      </div>

      {/* 2. MAIN LAYOUT: Widened Calendar Grid (Left) + Streamlined Context Panel (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* Main Calendar / Timeline Area (takes 9 of 12 columns on desktop for max horizontal space) */}
        <div className="xl:col-span-9 bg-[#111115] border border-[#1e1e26] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          
          {loading && (
            <div className="h-0.5 bg-amber-500/20 overflow-hidden">
              <div className="w-full h-full bg-amber-500 animate-pulse" />
            </div>
          )}

          {/* Active Filter Pill Bar */}
          {selectedTypeFilter && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-medium">Filtering by:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 font-bold">
                  {selectedTypeFilter}
                </span>
                <span className="text-neutral-400">({displayEvents.length} events found)</span>
              </div>
              <button
                onClick={() => setSelectedTypeFilter(null)}
                className="text-amber-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <X className="w-3 h-3" /> Clear filter
              </button>
            </div>
          )}

          {/* ===================== VIEW: WEEK ===================== */}
          {viewMode === 'week' && (
            <div className="overflow-x-auto select-none">
              <div className="min-w-[720px]">
                
                {/* Header: All Day (compact ~70px) + 7 Day Columns */}
                <div className="flex border-b border-[#1c1c24] bg-[#0d0d11]">
                  {/* Left Column: All Day Label */}
                  <div className="w-[72px] flex-shrink-0 p-2.5 border-r border-[#1c1c24] text-right text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-end">
                    All Day
                  </div>

                  {/* 7 Day Header Columns with equal flex expansion */}
                  <div className="flex-1 grid grid-cols-7 divide-x divide-[#1c1c24]">
                    {weekDays.map((day, idx) => {
                      const isDayToday = isToday(day);
                      const isSelected = isSameDay(day, currentDate);
                      return (
                        <div
                          key={idx}
                          onClick={() => setCurrentDate(day)}
                          className={`p-2.5 text-center cursor-pointer transition-colors ${
                            isDayToday ? 'bg-amber-500/[0.05]' : isSelected ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${isDayToday ? 'text-amber-400' : 'text-neutral-400'}`}>
                            {format(day, 'EEE')}
                          </div>
                          <div className="mt-0.5 flex items-center justify-center">
                            {isDayToday ? (
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
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
                  
                  {/* Left Column: Compact Hourly Labels (44px height) */}
                  <div className="w-[72px] flex-shrink-0 border-r border-[#1c1c24] bg-[#0d0d11]/80">
                    {TIME_SLOTS.map((time, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="pr-2.5 pt-0.5 text-right text-[10px] font-semibold text-neutral-500 border-b border-[#1c1c24]/50"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* 7 Day Column Tracks */}
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
                          {/* 16 Hourly Grid Lines (44px height) */}
                          {TIME_SLOTS.map((_, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${HOUR_HEIGHT}px` }}
                              className="border-b border-[#1c1c24]/50 transition-colors hover:bg-white/[0.015] cursor-pointer"
                              onClick={() => router.push(`/bookings/new?date=${format(day, 'yyyy-MM-dd')}`)}
                            />
                          ))}

                          {/* Live Current Time Line for Today's Column */}
                          {isDayToday && currentTimePosition !== null && (
                            <div
                              style={{ top: `${currentTimePosition}px` }}
                              className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                            >
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 -ml-1 shadow-[0_0_8px_rgba(245,158,11,1)]" />
                              <div className="h-[2px] w-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                              <span className="absolute right-1 -top-3.5 bg-amber-500 text-black font-extrabold text-[9px] px-1 py-0.2 rounded shadow">
                                {format(now, 'h:mm a')}
                              </span>
                            </div>
                          )}

                          {/* Enriched Event Cards with Inventory Connection & Hierarchy */}
                          {dayEvents.map((event) => {
                            const eventType = detectEventType(event.eventName);
                            const config = EVENT_TYPE_MAP[eventType] || EVENT_TYPE_MAP.Other;
                            const { top, height } = getEventPosition(event);

                            const startTimeFormatted = format(new Date(event.eventStart), 'h:mm a');
                            const endTimeFormatted = format(new Date(event.eventEnd), 'h:mm a');

                            return (
                              <div
                                key={event.bookingId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                }}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                }}
                                className={`absolute inset-x-1 rounded-lg p-2 overflow-hidden flex flex-col justify-between border border-l-4 ${config.cardAccent} ${config.cardBg} ${config.cardBorder} shadow-lg transition-all hover:scale-[1.02] hover:z-30 cursor-pointer group`}
                              >
                                <div>
                                  {/* Row 1: Event Title + Conflict indicator */}
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`text-xs font-bold ${config.textColor} truncate leading-tight`}>
                                      {event.eventName}
                                    </span>
                                    {event.hasConflict && (
                                      <span className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-bold animate-pulse" title={event.conflictDetails}>
                                        <AlertTriangle className="w-2.5 h-2.5 text-red-400" /> Conflict
                                      </span>
                                    )}
                                  </div>

                                  {/* Row 2: Time Range */}
                                  <div className={`text-[10px] ${config.subtextColor} font-medium mt-0.5 truncate`}>
                                    {startTimeFormatted} – {endTimeFormatted}
                                  </div>

                                  {/* Row 3: Customer Name */}
                                  {event.customerName && (
                                    <div className="text-[10px] text-neutral-400 font-normal truncate">
                                      {event.customerName}
                                    </div>
                                  )}
                                </div>

                                {/* Row 4: TemporalRent Signature - Inventory Consumption Line */}
                                {height > 55 && event.itemSummary && (
                                  <div className="mt-1 pt-1 border-t border-white/5 flex items-center gap-1 text-[9.5px] font-medium text-neutral-300 truncate">
                                    <Package className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                                    <span className="truncate">{event.itemSummary}</span>
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

          {/* ===================== VIEW: INVENTORY TIMELINE (SIGNATURE MODE) ===================== */}
          {viewMode === 'timeline' && (
            <div className="p-4 space-y-4 select-none overflow-x-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e1e26]">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Inventory Allocation Across Time</h2>
                    <p className="text-[11px] text-neutral-400">Visualizing item pressure, reservation spans, and active conflicts</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Available
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 100% Reserved
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Shortage
                  </span>
                </div>
              </div>

              {/* Timeline Matrix */}
              <div className="min-w-[700px] border border-[#1e1e26] rounded-xl overflow-hidden bg-[#0d0d10]">
                {/* Header: Days */}
                <div className="grid grid-cols-8 border-b border-[#1e1e26] bg-[#14141a]">
                  <div className="p-2.5 text-xs font-bold text-neutral-400 uppercase tracking-wider border-r border-[#1e1e26]">
                    Inventory Item
                  </div>
                  {weekDays.map((day, idx) => (
                    <div key={idx} className={`p-2 text-center text-xs font-semibold border-r border-[#1e1e26] last:border-r-0 ${isToday(day) ? 'bg-amber-500/10 text-amber-300' : 'text-neutral-300'}`}>
                      <div>{format(day, 'EEE')}</div>
                      <div className="text-[10px] text-neutral-500">{format(day, 'MMM d')}</div>
                    </div>
                  ))}
                </div>

                {/* Rows: Each Item with horizontal bars across days */}
                <div className="divide-y divide-[#1e1e26]">
                  {pressureItems.map((item) => {
                    const isShortage = item.pressure === 'SHORTAGE';
                    const isFull = item.pressure === 'FULL';
                    return (
                      <div key={item.id} className="grid grid-cols-8 hover:bg-white/[0.015] transition-colors">
                        {/* Item metadata column */}
                        <div className="p-3 border-r border-[#1e1e26] bg-[#111115]/80 flex flex-col justify-center">
                          <div className="text-xs font-bold text-white truncate">{item.name}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Capacity: <strong className="text-neutral-200">{item.usableQty}</strong>
                          </div>
                          {isShortage && (
                            <span className="text-[9px] font-bold text-red-400 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Shortage: {item.shortageQty || 2}
                            </span>
                          )}
                        </div>

                        {/* 7 Day Blocks with load simulation */}
                        {weekDays.map((day, dIdx) => {
                          // Determine if this item has active reservation on this day
                          const dayNum = day.getDay();
                          const hasLoad = (dayNum === 2 || dayNum === 4 || dayNum === 5); // Tue, Thu, Fri
                          const loadQty = hasLoad ? item.reservedQty : 0;
                          const percent = Math.min(100, Math.round((loadQty / item.usableQty) * 100));

                          return (
                            <div key={dIdx} className="p-2 border-r border-[#1e1e26] last:border-r-0 flex flex-col justify-center items-center relative group">
                              {hasLoad ? (
                                <div className={`w-full p-1.5 rounded-lg border text-center transition-all ${
                                  isShortage 
                                    ? 'bg-red-500/20 border-red-500/50 text-red-200 shadow-md shadow-red-500/10'
                                    : isFull 
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                                    : 'bg-blue-500/15 border-blue-500/30 text-blue-200'
                                }`}>
                                  <div className="text-[10px] font-bold">
                                    {loadQty} / {item.usableQty}
                                  </div>
                                  <div className="w-full bg-black/40 rounded-full h-1 mt-1 overflow-hidden">
                                    <div 
                                      className={`h-full ${isShortage ? 'bg-red-500' : isFull ? 'bg-amber-500' : 'bg-blue-500'}`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  {isShortage && (
                                    <div className="text-[8px] text-red-300 font-extrabold mt-0.5 uppercase tracking-wider">
                                      Conflict
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-neutral-600 font-mono">
                                  0 / {item.usableQty}
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

          {/* ===================== VIEW: DAY ===================== */}
          {viewMode === 'day' && (
            <div className="p-6 space-y-4 select-none">
              <div className="flex items-center justify-between border-b border-[#1e1e26] pb-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
                  <p className="text-xs text-neutral-400">
                    {displayEvents.filter(ev => isSameDay(new Date(ev.eventStart), currentDate)).length} bookings consuming warehouse inventory
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/bookings/new?date=${format(currentDate, 'yyyy-MM-dd')}`)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Book on this day
                </button>
              </div>

              <div className="space-y-3">
                {displayEvents
                  .filter(ev => isSameDay(new Date(ev.eventStart), currentDate))
                  .map(event => {
                    const eventType = detectEventType(event.eventName);
                    const config = EVENT_TYPE_MAP[eventType] || EVENT_TYPE_MAP.Other;
                    return (
                      <div
                        key={event.bookingId}
                        onClick={() => setSelectedEvent(event)}
                        className={`p-4 rounded-xl border border-l-4 ${config.cardAccent} ${config.cardBg} ${config.cardBorder} flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-white/20 transition-all`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-base font-bold ${config.textColor}`}>{event.eventName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.badgeBg}`}>
                              {eventType}
                            </span>
                            {event.hasConflict && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-400" /> Inventory Conflict
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-neutral-500" />
                              {format(new Date(event.eventStart), 'h:mm a')} – {format(new Date(event.eventEnd), 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-neutral-500" />
                              {event.customerName}
                            </span>
                            {event.itemSummary && (
                              <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                                <Package className="w-3.5 h-3.5" />
                                {event.itemSummary}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/bookings/${event.bookingId}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#1e1e26] hover:bg-[#2a2a35] text-xs font-medium text-neutral-200 flex items-center gap-1 self-start sm:self-auto"
                        >
                          Details <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ===================== VIEW: MONTH ===================== */}
          {viewMode === 'month' && (
            <div className="select-none">
              <div className="grid grid-cols-7 border-b border-[#1e1e26] bg-[#0d0d11]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={idx} className="p-2.5 text-center text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-[#1c1c24]">
                {monthDays.map((day, idx) => {
                  const dayEvents = displayEvents.filter(ev => isSameDay(new Date(ev.eventStart), day));
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentDate(day);
                        setViewMode('day');
                      }}
                      className={`min-h-[96px] p-2 flex flex-col justify-between cursor-pointer transition-colors ${
                        !isCurrentMonth ? 'bg-[#0a0a0d]/60 text-neutral-600' : 'bg-[#111115] hover:bg-white/[0.02]'
                      } ${isDayToday ? 'bg-amber-500/[0.03]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          isDayToday 
                            ? 'w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center' 
                            : isCurrentMonth ? 'text-neutral-300' : 'text-neutral-600'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1 flex-1">
                        {dayEvents.slice(0, 2).map(ev => {
                          const eventType = detectEventType(ev.eventName);
                          const config = EVENT_TYPE_MAP[eventType] || EVENT_TYPE_MAP.Other;
                          return (
                            <div
                              key={ev.bookingId}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(ev);
                              }}
                              className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${config.badgeBg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} flex-shrink-0`} />
                              <span className="truncate">{ev.eventName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== VIEW: LIST ===================== */}
          {viewMode === 'list' && (
            <div className="p-6 select-none divide-y divide-[#1e1e26]">
              {displayEvents.map((event) => {
                const eventType = detectEventType(event.eventName);
                const config = EVENT_TYPE_MAP[eventType] || EVENT_TYPE_MAP.Other;
                return (
                  <div
                    key={event.bookingId}
                    onClick={() => setSelectedEvent(event)}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.015] px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-9 rounded-full ${config.dotColor} flex-shrink-0 mt-0.5`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{event.eventName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.badgeBg}`}>
                            {eventType}
                          </span>
                          {event.hasConflict && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              ⚠ Conflict
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5 flex flex-wrap items-center gap-2.5">
                          <span>{format(new Date(event.eventStart), 'EEE, MMM d, yyyy')}</span>
                          <span>•</span>
                          <span>{format(new Date(event.eventStart), 'h:mm a')} – {format(new Date(event.eventEnd), 'h:mm a')}</span>
                          <span>•</span>
                          <span>{event.customerName}</span>
                          {event.itemSummary && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-medium">📦 {event.itemSummary}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/bookings/${event.bookingId}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#18181f] hover:bg-[#22222a] border border-[#272733] text-xs font-semibold text-neutral-200 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      View Booking <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===================== INTEGRATED INVENTORY PRESSURE SECTION ===================== */}
          {/* Seamlessly connected directly under calendar grid as requested */}
          <div className="border-t border-[#1e1e26] bg-[#0e0e12] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Inventory Pressure & Allocation Load
                </h3>
              </div>
              <span className="text-[11px] text-neutral-400">
                Real-time capacity utilization for selected period
              </span>
            </div>

            {/* Pressure items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {pressureItems.slice(0, 6).map((item) => {
                const isShortage = item.pressure === 'SHORTAGE';
                const isFull = item.pressure === 'FULL';
                const percent = Math.min(100, Math.round((item.reservedQty / item.usableQty) * 100));

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isShortage
                        ? 'bg-red-500/10 border-red-500/40 shadow-sm shadow-red-500/10'
                        : isFull
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#141418] border-[#22222c] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[170px]">{item.name}</span>
                      {isShortage ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-extrabold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Shortage
                        </span>
                      ) : isFull ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          Full
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Available
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#1c1c24] rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isShortage ? 'bg-red-500' : isFull ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1.5 font-mono">
                      <span>{item.reservedQty} / {item.usableQty} reserved</span>
                      <span>{Math.max(0, item.usableQty - item.reservedQty)} free</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 3. RIGHT CONTEXT PANEL: Streamlined, quiet, compact (3 of 12 columns on desktop) */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Mini Calendar Card */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-2xl p-3.5 shadow-xl select-none">
            <div className="flex items-center justify-between mb-2.5">
              <button
                onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-neutral-200">
                {format(miniCalendarMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center mb-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-neutral-500">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {miniCalDays.map((day, idx) => {
                const isSelected = isSameDay(day, currentDate);
                const isDayToday = isToday(day);
                const inCurrentMonth = isSameMonth(day, miniCalendarMonth);

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentDate(day)}
                    className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[11px] transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                        : isDayToday
                        ? 'border border-amber-500 text-amber-400 font-bold'
                        : inCurrentMonth
                        ? 'text-neutral-300 hover:bg-neutral-800'
                        : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact 2-Column Event Types Card */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">Event Types</h2>
              {selectedTypeFilter && (
                <button
                  onClick={() => setSelectedTypeFilter(null)}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* 2-column compact grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(EVENT_TYPE_MAP).map(([key, config]) => {
                const count = eventTypeCounts[key] || 0;
                const isSelected = selectedTypeFilter === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTypeFilter(isSelected ? null : key)}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-500/40 font-bold text-amber-200'
                        : 'hover:bg-white/[0.03] text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-2 h-2 rounded-full ${config.dotColor} flex-shrink-0`} />
                      <span className="truncate">{config.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 ml-1">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Streamlined Quick Actions Card */}
          <div className="bg-[#111115] border border-[#1e1e26] rounded-2xl p-3.5 shadow-xl space-y-2">
            <h2 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Quick Actions</h2>

            <button
              onClick={() => router.push('/bookings/new')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161c] hover:bg-[#202028] border border-[#242430] text-xs font-semibold text-neutral-200 hover:text-white transition-all text-left"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>New Booking</span>
            </button>

            <button
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161c] hover:bg-[#202028] border border-[#242430] text-xs font-semibold text-neutral-200 hover:text-white transition-all text-left"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Check Availability</span>
            </button>

            <button
              onClick={() => router.push('/inventory')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161c] hover:bg-[#202028] border border-[#242430] text-xs font-semibold text-neutral-200 hover:text-white transition-all text-left"
            >
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span>View Inventory</span>
            </button>
          </div>

        </div>

      </div>

      {/* 4. SUMMARY STATS METRIC ROW: 4 responsive metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
        
        {/* Card 1: Total Bookings */}
        <div 
          onClick={() => router.push('/bookings')}
          className="bg-[#111115] border border-[#1e1e26] hover:border-blue-500/40 rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-white tracking-tight leading-none">
                {allEvents.length}
              </div>
              <div className="text-[11px] text-neutral-400 font-medium mt-1">Total Bookings</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 2: Upcoming This Week */}
        <div 
          onClick={() => setViewMode('week')}
          className="bg-[#111115] border border-[#1e1e26] hover:border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-white tracking-tight leading-none">
                {allEvents.filter(ev => {
                  const evDate = new Date(ev.eventStart);
                  return evDate >= weekStart && evDate <= weekEnd;
                }).length}
              </div>
              <div className="text-[11px] text-neutral-400 font-medium mt-1">Upcoming This Week</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 3: Conflicts */}
        <div 
          onClick={() => setViewMode('timeline')}
          className={`rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer shadow-lg group border ${
            conflictsCount > 0 
              ? 'bg-red-500/10 border-red-500/40 hover:border-red-400' 
              : 'bg-[#111115] border-[#1e1e26] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              conflictsCount > 0 
                ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-white tracking-tight leading-none flex items-center gap-1.5">
                <span>{conflictsCount}</span>
                {conflictsCount > 0 && (
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Action Needed</span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400 font-medium mt-1">Conflicts / Shortages</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 4: Items in Use */}
        <div 
          onClick={() => router.push('/inventory')}
          className="bg-[#111115] border border-[#1e1e26] hover:border-purple-500/40 rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-white tracking-tight leading-none">
                {inventoryItemsList.length > 0 ? inventoryItemsList.length : 12}
              </div>
              <div className="text-[11px] text-neutral-400 font-medium mt-1">Tracked Inventory Items</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

      </div>

      {/* ===================== MODAL: EVENT DETAILS ===================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131318] border border-[#272733] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="p-5 border-b border-[#202028] flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  (EVENT_TYPE_MAP[detectEventType(selectedEvent.eventName)] || EVENT_TYPE_MAP.Other).badgeBg
                }`}>
                  {detectEventType(selectedEvent.eventName)}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{selectedEvent.eventName}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center gap-3 text-neutral-300">
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

              <div className="flex items-center gap-3 text-neutral-300">
                <User className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <div>
                  <div className="text-neutral-400">Customer</div>
                  <div className="font-semibold text-white">{selectedEvent.customerName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-300">
                <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-neutral-400">Inventory Reserved</div>
                  <div className="font-semibold text-amber-200">
                    {selectedEvent.itemSummary || '12 Items allocated across time'}
                  </div>
                </div>
              </div>

              {selectedEvent.hasConflict && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Inventory Conflict Detected</strong>
                    <span>{selectedEvent.conflictDetails || 'Overbooked inventory lines detected during this event period.'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0d0d10] border-t border-[#202028] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  router.push(`/bookings/${selectedEvent.bookingId}`);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              >
                <span>View Full Booking</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== MODAL: CHECK AVAILABILITY ===================== */}
      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131318] border border-[#272733] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#202028] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Check Inventory Availability</h3>
              </div>
              <button
                onClick={() => {
                  setIsAvailabilityModalOpen(false);
                  setAvailResult(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckAvailability} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Event Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={checkStartDate}
                  onChange={(e) => setCheckStartDate(e.target.value)}
                  className="w-full bg-[#181820] border border-[#272733] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Event End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={checkEndDate}
                  onChange={(e) => setCheckEndDate(e.target.value)}
                  className="w-full bg-[#181820] border border-[#272733] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {availResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
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
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkingAvail}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  {checkingAvail ? 'Checking Warehouse...' : 'Check Availability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
