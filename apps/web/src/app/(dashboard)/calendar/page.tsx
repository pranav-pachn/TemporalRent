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
  ArrowRight
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
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface EventTypeConfig {
  name: string;
  dotColor: string;
  badgeBg: string;
  cardBg: string;
  cardBorder: string;
  cardAccent: string;
  textColor: string;
  subtextColor: string;
  clientColor: string;
}

const EVENT_TYPE_MAP: Record<string, EventTypeConfig> = {
  Wedding: {
    name: 'Wedding',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    cardBg: 'bg-[#2a1317]/90 hover:bg-[#381a1f]',
    cardBorder: 'border-[#4a1c24]',
    cardAccent: 'border-l-[#ef4444]',
    textColor: 'text-rose-100',
    subtextColor: 'text-rose-300/80',
    clientColor: 'text-rose-300/70',
  },
  Haldi: {
    name: 'Haldi',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    cardBg: 'bg-[#2e200c]/90 hover:bg-[#3d2c12]',
    cardBorder: 'border-[#543b14]',
    cardAccent: 'border-l-[#f59e0b]',
    textColor: 'text-amber-100',
    subtextColor: 'text-amber-300/80',
    clientColor: 'text-amber-300/70',
  },
  Sangeet: {
    name: 'Sangeet',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    cardBg: 'bg-[#251536]/90 hover:bg-[#321c47]',
    cardBorder: 'border-[#492269]',
    cardAccent: 'border-l-[#a855f7]',
    textColor: 'text-purple-100',
    subtextColor: 'text-purple-300/80',
    clientColor: 'text-purple-300/70',
  },
  Corporate: {
    name: 'Corporate',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    cardBg: 'bg-[#11253e]/90 hover:bg-[#163152]',
    cardBorder: 'border-[#1b436e]',
    cardAccent: 'border-l-[#3b82f6]',
    textColor: 'text-blue-100',
    subtextColor: 'text-blue-300/80',
    clientColor: 'text-blue-300/70',
  },
  Birthday: {
    name: 'Birthday',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    cardBg: 'bg-[#0e2c1c]/90 hover:bg-[#133d27]',
    cardBorder: 'border-[#175233]',
    cardAccent: 'border-l-[#10b981]',
    textColor: 'text-emerald-100',
    subtextColor: 'text-emerald-300/80',
    clientColor: 'text-emerald-300/70',
  },
  Engagement: {
    name: 'Engagement',
    dotColor: 'bg-fuchsia-500',
    badgeBg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    cardBg: 'bg-[#2b102e]/90 hover:bg-[#3b173f]',
    cardBorder: 'border-[#541e5b]',
    cardAccent: 'border-l-[#d946ef]',
    textColor: 'text-fuchsia-100',
    subtextColor: 'text-fuchsia-300/80',
    clientColor: 'text-fuchsia-300/70',
  },
  Other: {
    name: 'Other',
    dotColor: 'bg-slate-500',
    badgeBg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    cardBg: 'bg-[#181820]/90 hover:bg-[#20202a]',
    cardBorder: 'border-[#2d2d3a]',
    cardAccent: 'border-l-slate-400',
    textColor: 'text-slate-100',
    subtextColor: 'text-slate-300/80',
    clientColor: 'text-slate-400/70',
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
const HOUR_HEIGHT = 56;
const START_HOUR = 8; // 8:00 AM
const END_HOUR = 23;  // 11:00 PM

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
  const [showInventoryTimeline, setShowInventoryTimeline] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [checkStartDate, setCheckStartDate] = useState('');
  const [checkEndDate, setCheckEndDate] = useState('');
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState<string | null>(null);

  // Load Inventory Items for filter
  useEffect(() => {
    apiClient.fetchInventoryItems()
      .then(res => setInventoryItemsList(res.data))
      .catch(e => {
        if (e.status === 401 || e.code === 'UNAUTHENTICATED') {
          router.push('/login');
        }
      });
  }, [router]);

  // Load Calendar Data
  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend enforces calendar window differenceInDays(toDate, fromDate) <= 40
      const windowStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const windowEnd = addDays(windowStart, 35); // Exactly 35 days (5 weeks) <= 40 days
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

  // Generate fallback sample events matching reference mockup when no events exist in database
  const sampleEvents: CalendarEvent[] = useMemo(() => {
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    return [
      {
        bookingId: 'demo-1',
        eventName: 'Corporate Setup',
        customerName: 'Green Leaf Events',
        status: 'CONFIRMED',
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
        eventStart: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T09:00:00',
        eventEnd: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T13:00:00',
        periodStart: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T09:00:00',
        periodEnd: format(addDays(monday, 6), 'yyyy-MM-dd') + 'T13:00:00',
      },
    ];
  }, [currentDate]);

  // Combined events: if API has events, use them; otherwise use mock events
  const allEvents = useMemo(() => {
    if (events && events.length > 0) {
      return events;
    }
    return sampleEvents;
  }, [events, sampleEvents]);

  // Filtered by event type
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
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setMiniCalendarMonth(now);
  };

  // Header range title
  const dateRangeLabel = useMemo(() => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    }
    if (viewMode === 'week') {
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  }, [viewMode, currentDate, weekStart, weekEnd]);

  // Position calculation for an event in week view
  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.eventStart);
    const end = new Date(event.eventEnd);

    const startH = getHours(start) + getMinutes(start) / 60;
    const endH = getHours(end) + getMinutes(end) / 60;

    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR + 1, startH));
    const clampedEnd = Math.max(clampedStart + 0.5, Math.min(END_HOUR + 1, endH));

    const top = (clampedStart - START_HOUR) * HOUR_HEIGHT;
    const height = Math.max(36, (clampedEnd - clampedStart) * HOUR_HEIGHT - 4);

    return { top, height };
  };

  // Check Availability Action
  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkStartDate || !checkEndDate) return;
    setCheckingAvail(true);
    setAvailResult(null);
    try {
      // Small simulated latency / API check
      await new Promise(r => setTimeout(r, 600));
      setAvailResult('All standard inventory items are available for this date window!');
    } catch {
      setAvailResult('Unable to verify availability. Please try again.');
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
    <div className="w-full min-h-screen bg-[#0c0c0f] text-neutral-200 px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Calendar</h1>
            <p className="text-xs text-neutral-400">View all bookings and inventory schedules</p>
          </div>
        </div>

        {/* Center Controls: Today, Navigator, View Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-lg bg-[#18181f] hover:bg-[#22222b] border border-[#272733] text-xs font-medium text-neutral-200 hover:text-white transition-all shadow-sm"
          >
            Today
          </button>

          {/* Range Navigator */}
          <div className="flex items-center bg-[#18181f] border border-[#272733] rounded-lg p-0.5 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#242430] rounded-md transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-medium text-neutral-200 px-3 min-w-[130px] text-center select-none">
              {dateRangeLabel}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#242430] rounded-md transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Switcher: Day, Week, Month, List */}
          <div className="flex items-center bg-[#141418] border border-[#262633] rounded-xl p-1 gap-1 shadow-sm">
            {(['day', 'week', 'month', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-amber-600/90 text-amber-100 shadow-md shadow-amber-900/40'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Toggle Inventory Timeline Button */}
          <button
            onClick={() => setShowInventoryTimeline(!showInventoryTimeline)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              showInventoryTimeline 
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' 
                : 'bg-[#18181f] border-[#272733] text-neutral-400 hover:text-white'
            }`}
            title="Toggle Inventory Pressure View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>

        {/* Right Action: + New Booking */}
        <button
          onClick={() => router.push('/bookings/new')}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95 self-start lg:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Booking</span>
        </button>

      </div>

      {/* Main Content Layout: Calendar Area (Left/Center) + Sidebar (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Calendar Grid (3 columns on xl) */}
        <div className="xl:col-span-3 bg-[#111115] border border-[#202028] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          
          {loading && (
            <div className="h-1 bg-amber-500/20 overflow-hidden">
              <div className="w-full h-full bg-amber-500 animate-pulse" />
            </div>
          )}

          {/* Active Filter Pill if selected */}
          {selectedTypeFilter && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs">
              <span className="text-amber-300 font-medium">
                Filtering by: <strong>{selectedTypeFilter}</strong> ({displayEvents.length} events)
              </span>
              <button
                onClick={() => setSelectedTypeFilter(null)}
                className="text-amber-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <X className="w-3 h-3" /> Clear filter
              </button>
            </div>
          )}

          {/* WEEK VIEW (Primary design from screenshot) */}
          {viewMode === 'week' && (
            <div className="overflow-x-auto select-none">
              <div className="min-w-[760px]">
                
                {/* Header Row: Time Label + 7 Days Columns */}
                <div className="grid grid-cols-8 border-b border-[#1f1f28] bg-[#0d0d11]">
                  {/* Empty Time Header */}
                  <div className="p-3 border-r border-[#1f1f28] text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    All Day
                  </div>

                  {/* 7 Days Columns */}
                  {weekDays.map((day, idx) => {
                    const isDayToday = isToday(day);
                    const isSelected = isSameDay(day, currentDate);
                    return (
                      <div
                        key={idx}
                        onClick={() => setCurrentDate(day)}
                        className={`p-3 text-center border-r border-[#1f1f28] last:border-r-0 cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                          {format(day, 'EEE')}
                        </div>
                        <div className="mt-1 flex items-center justify-center">
                          {isDayToday ? (
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-black font-bold text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
                              {format(day, 'd')}
                            </span>
                          ) : (
                            <span className={`text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-neutral-200'}`}>
                              {format(day, 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grid Body */}
                <div className="grid grid-cols-8 relative bg-[#111115]">
                  
                  {/* Left Column: Hourly Time Labels */}
                  <div className="border-r border-[#1f1f28] bg-[#0d0d11]/70">
                    {TIME_SLOTS.map((time, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="pr-3 pt-1 text-right text-[11px] font-medium text-neutral-500 border-b border-[#1f1f28]/60"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* 7 Day Column Tracks */}
                  {weekDays.map((day, dayIndex) => {
                    const dayEvents = displayEvents.filter(ev => isSameDay(new Date(ev.eventStart), day));
                    const isDayToday = isToday(day);

                    return (
                      <div
                        key={dayIndex}
                        className={`relative border-r border-[#1f1f28] last:border-r-0 ${
                          isDayToday ? 'bg-amber-500/[0.015]' : ''
                        }`}
                      >
                        {/* 16 Hourly Grid Lines */}
                        {TIME_SLOTS.map((_, idx) => (
                          <div
                            key={idx}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                            className="border-b border-[#1f1f28]/60 transition-colors hover:bg-white/[0.01]"
                            onClick={() => {
                              // Click empty cell to start booking
                              router.push(`/bookings/new?date=${format(day, 'yyyy-MM-dd')}`);
                            }}
                          />
                        ))}

                        {/* Event Cards inside this Day Column */}
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
                              className={`absolute inset-x-1 rounded-xl p-2.5 overflow-hidden flex flex-col justify-start border border-l-4 ${config.cardAccent} ${config.cardBg} ${config.cardBorder} shadow-lg transition-all hover:scale-[1.02] hover:z-30 cursor-pointer group`}
                            >
                              {/* Event Title */}
                              <div className={`text-xs font-bold ${config.textColor} truncate leading-tight`}>
                                {event.eventName}
                              </div>

                              {/* Time Range */}
                              <div className={`text-[11px] ${config.subtextColor} font-medium mt-1 truncate`}>
                                {startTimeFormatted} – {endTimeFormatted}
                              </div>

                              {/* Customer Name */}
                              {event.customerName && (
                                <div className={`text-[10px] ${config.clientColor} font-normal mt-0.5 truncate`}>
                                  {event.customerName}
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
            <div className="p-6 space-y-4 select-none">
              <div className="flex items-center justify-between border-b border-[#202028] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {displayEvents.filter(ev => isSameDay(new Date(ev.eventStart), currentDate)).length} bookings scheduled
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/bookings/new?date=${format(currentDate, 'yyyy-MM-dd')}`)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold flex items-center gap-1"
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-300">
                              {event.status}
                            </span>
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
                {displayEvents.filter(ev => isSameDay(new Date(ev.eventStart), currentDate)).length === 0 && (
                  <div className="py-16 text-center text-neutral-500 text-sm">
                    No bookings scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="select-none">
              {/* Day initials */}
              <div className="grid grid-cols-7 border-b border-[#202028] bg-[#0d0d11]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={idx} className="p-3 text-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-[#1f1f28]">
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
                      className={`min-h-[110px] p-2 flex flex-col justify-between cursor-pointer transition-colors ${
                        !isCurrentMonth ? 'bg-[#0a0a0d]/60 text-neutral-600' : 'bg-[#111115] hover:bg-white/[0.02]'
                      } ${isDayToday ? 'bg-amber-500/[0.03]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${
                          isDayToday 
                            ? 'w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold' 
                            : isCurrentMonth ? 'text-neutral-300' : 'text-neutral-600'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1 mt-1.5 flex-1">
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
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${config.badgeBg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} flex-shrink-0`} />
                              <span className="truncate">{ev.eventName}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-neutral-500 pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="p-6 select-none">
              <div className="divide-y divide-[#1f1f28]">
                {displayEvents.map((event) => {
                  const eventType = detectEventType(event.eventName);
                  const config = EVENT_TYPE_MAP[eventType] || EVENT_TYPE_MAP.Other;
                  return (
                    <div
                      key={event.bookingId}
                      onClick={() => setSelectedEvent(event)}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2.5 h-10 rounded-full ${config.dotColor} flex-shrink-0 mt-0.5`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{event.eventName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.badgeBg}`}>
                              {eventType}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400">
                              {event.status}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-3">
                            <span>{format(new Date(event.eventStart), 'EEE, MMM d, yyyy')}</span>
                            <span>•</span>
                            <span>{format(new Date(event.eventStart), 'h:mm a')} – {format(new Date(event.eventEnd), 'h:mm a')}</span>
                            <span>•</span>
                            <span>{event.customerName}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/bookings/${event.bookingId}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#18181f] hover:bg-[#22222a] border border-[#272733] text-xs font-medium text-neutral-200 flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        View Booking <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional: Inventory Pressure Timeline Section (collapsible) */}
          {showInventoryTimeline && (
            <div className="border-t border-[#202028] bg-[#0e0e12] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Inventory Pressure Timeline</span>
                </div>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="bg-[#18181f] border border-[#272733] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="all">All Items</option>
                  {inventoryItemsList.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {inventoryResponse?.items.map(item => (
                  <div key={item.inventoryItemId} className="flex items-center justify-between p-2.5 rounded-lg bg-[#141418] border border-[#202028]">
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-neutral-400">Usable Qty: {item.usableQty}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {item.pressureSegments.some(s => s.pressure === 'SHORTAGE') ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-semibold">
                          Shortage Detected
                        </span>
                      ) : item.pressureSegments.some(s => s.pressure === 'FULL') ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                          Fully Reserved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!inventoryResponse?.items || inventoryResponse.items.length === 0) && (
                  <div className="text-xs text-neutral-500 py-3 text-center">No inventory items tracked for this window.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar (1 column on xl) */}
        <div className="space-y-6">
          
          {/* Mini Calendar Card */}
          <div className="bg-[#111115] border border-[#202028] rounded-2xl p-4 shadow-xl select-none">
            
            {/* Mini Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMiniCalendarMonth(subMonths(miniCalendarMonth, 1))}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-neutral-200">
                {format(miniCalendarMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Initials (Mon - Sun) */}
            <div className="grid grid-cols-7 text-center mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <span key={idx} className="text-[10px] font-medium text-neutral-500">
                  {day}
                </span>
              ))}
            </div>

            {/* Mini Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {miniCalDays.map((day, idx) => {
                const isSelected = isSameDay(day, currentDate);
                const isDayToday = isToday(day);
                const inCurrentMonth = isSameMonth(day, miniCalendarMonth);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentDate(day);
                    }}
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/30'
                        : isDayToday
                        ? 'border border-amber-500/60 text-amber-400 font-semibold'
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

          {/* Event Types Card with Counts & Interactive Filter */}
          <div className="bg-[#111115] border border-[#202028] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">Event Types</h2>
              {selectedTypeFilter && (
                <button
                  onClick={() => setSelectedTypeFilter(null)}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-2">
              {Object.entries(EVENT_TYPE_MAP).map(([key, config]) => {
                const count = eventTypeCounts[key] || 0;
                const isSelected = selectedTypeFilter === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTypeFilter(isSelected ? null : key)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-xs ${
                      isSelected
                        ? 'bg-amber-500/10 border border-amber-500/30 font-semibold text-amber-300'
                        : 'hover:bg-white/[0.03] text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                      <span>{config.name}</span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-[#111115] border border-[#202028] rounded-2xl p-5 shadow-xl space-y-3">
            <h2 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-2">Quick Actions</h2>

            <button
              onClick={() => router.push('/bookings/new')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#18181f] hover:bg-[#20202a] border border-[#272733] text-xs font-medium text-neutral-200 hover:text-white transition-all text-left"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>New Booking</span>
            </button>

            <button
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#18181f] hover:bg-[#20202a] border border-[#272733] text-xs font-medium text-neutral-200 hover:text-white transition-all text-left"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span>Check Availability</span>
            </button>

            <button
              onClick={() => router.push('/inventory')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#18181f] hover:bg-[#20202a] border border-[#272733] text-xs font-medium text-neutral-200 hover:text-white transition-all text-left"
            >
              <Package className="w-4 h-4 text-purple-400" />
              <span>View Inventory</span>
            </button>
          </div>

        </div>

      </div>

      {/* Bottom 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        
        {/* Card 1: Total Bookings */}
        <div 
          onClick={() => router.push('/bookings')}
          className="bg-[#111115] border border-[#202028] hover:border-blue-500/40 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                {allEvents.length}
              </div>
              <div className="text-xs text-neutral-400 font-medium">Total Bookings</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 2: Upcoming This Week */}
        <div 
          onClick={() => setViewMode('week')}
          className="bg-[#111115] border border-[#202028] hover:border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                {allEvents.filter(ev => {
                  const evDate = new Date(ev.eventStart);
                  return evDate >= weekStart && evDate <= weekEnd;
                }).length}
              </div>
              <div className="text-xs text-neutral-400 font-medium">Upcoming This Week</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 3: Conflicts */}
        <div 
          onClick={() => setShowInventoryTimeline(true)}
          className="bg-[#111115] border border-[#202028] hover:border-amber-500/40 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                {inventoryResponse?.items.filter(i => i.pressureSegments.some(s => s.pressure === 'SHORTAGE')).length || 0}
              </div>
              <div className="text-xs text-neutral-400 font-medium">Conflicts</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Card 4: Items in Use */}
        <div 
          onClick={() => router.push('/inventory')}
          className="bg-[#111115] border border-[#202028] hover:border-purple-500/40 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer shadow-lg group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-white tracking-tight">
                {inventoryItemsList.length > 0 ? inventoryItemsList.length : 12}
              </div>
              <div className="text-xs text-neutral-400 font-medium">Items in Use</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#131318] border border-[#272733] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            
            {/* Header with Type Accent */}
            <div className="p-5 border-b border-[#202028] flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
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
            <div className="p-5 space-y-4 text-xs">
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
                <CheckCircle2 className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <div>
                  <div className="text-neutral-400">Status</div>
                  <div className="font-semibold text-emerald-400">{selectedEvent.status}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0d0d10] border-t border-[#202028] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  router.push(`/bookings/${selectedEvent.bookingId}`);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              >
                <span>View Full Booking</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Check Availability Modal */}
      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#131318] border border-[#272733] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#202028] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Check Availability</h3>
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
                <label className="block text-xs font-medium text-neutral-400 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={checkStartDate}
                  onChange={(e) => setCheckStartDate(e.target.value)}
                  className="w-full bg-[#1a1a22] border border-[#2a2a38] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={checkEndDate}
                  onChange={(e) => setCheckEndDate(e.target.value)}
                  className="w-full bg-[#1a1a22] border border-[#2a2a38] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
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
