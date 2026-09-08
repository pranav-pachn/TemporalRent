'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { CalendarEvent, CalendarInventoryResponse } from '@/types/calendar';
import { InventoryItem } from '@/types/inventory';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [inventoryResponse, setInventoryResponse] = useState<CalendarInventoryResponse | null>(null);
  const [inventoryItemsList, setInventoryItemsList] = useState<InventoryItem[]>([]);
  
  const [selectedItemId, setSelectedItemId] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Load the inventory items for the filter dropdown
  useEffect(() => {
    apiClient.fetchInventoryItems().then(res => setInventoryItemsList(res.data));
  }, []);

  // Fetch Calendar Data
  useEffect(() => {
    async function loadCalendar() {
      setLoading(true);
      try {
        const fromDateStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        // Add one extra day to `to` because the backend uses half-open interval [from, to)
        const toDateStr = format(addMonths(startOfMonth(currentMonth), 1), 'yyyy-MM-dd');

        const [eventsRes, invRes] = await Promise.all([
          apiClient.fetchCalendarEvents(fromDateStr, toDateStr),
          apiClient.fetchCalendarInventory(fromDateStr, toDateStr, selectedItemId === 'all' ? undefined : selectedItemId)
        ]);

        setEvents(eventsRes.data);
        setInventoryResponse(invRes.data);
      } catch (e) {
        console.error('Failed to load calendar data', e);
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, [currentMonth, selectedItemId]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Determine horizontal placement and width for an event/segment
  // Since we use days as our primary columns (each day = 64px width, for example)
  const DAY_WIDTH = 80;

  const getPositionStyles = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const monthStart = startOfMonth(currentMonth);
    
    // Calculate offset in hours from the start of the month
    const offsetHours = (start.getTime() - monthStart.getTime()) / (1000 * 60 * 60);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // If it starts before the month, cap it
    const leftOffset = Math.max(0, (offsetHours / 24) * DAY_WIDTH);
    
    // If it ends after the month, cap the width
    const totalDays = daysInMonth.length;
    const maxRight = totalDays * DAY_WIDTH;
    const rightEdge = Math.min(maxRight, ((offsetHours + durationHours) / 24) * DAY_WIDTH);
    
    const width = rightEdge - leftOffset;

    return {
      left: `${leftOffset}px`,
      width: `${Math.max(4, width)}px` // min width 4px to be visible
    };
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-semibold text-white tracking-tight">Calendar</h1>
        </div>
        
        <div className="flex items-center bg-neutral-900 border border-white/10 rounded-lg p-1">
          <button onClick={prevMonth} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-6 text-sm font-medium text-white min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button onClick={nextMonth} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center bg-neutral-900 border border-white/10 rounded-lg p-1">
          <button className="px-4 py-1.5 text-sm font-medium bg-neutral-800 text-white rounded-md shadow">Month</button>
          <button className="px-4 py-1.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Week</button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Timeline Header (Days Axis) */}
        <div className="flex border-b border-white/5 bg-neutral-950/50 overflow-x-auto hide-scrollbar pl-48 relative">
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-neutral-950 border-r border-white/5 z-10 p-4 flex items-center shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</span>
          </div>
          <div className="flex relative" style={{ width: `${daysInMonth.length * DAY_WIDTH}px` }}>
            {daysInMonth.map((day, i) => (
              <div 
                key={i} 
                className={`flex-shrink-0 flex flex-col items-center justify-center py-3 border-r border-white/5 ${
                  isSameDay(day, new Date()) ? 'bg-blue-500/10' : ''
                }`}
                style={{ width: `${DAY_WIDTH}px` }}
              >
                <span className="text-[10px] text-neutral-500 font-medium uppercase">{format(day, 'EEE')}</span>
                <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-blue-400' : 'text-neutral-300'}`}>
                  {format(day, 'dd')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-x-auto hide-scrollbar">
          
          {loading && (
            <div className="absolute inset-0 z-50 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center">
              <div className="animate-pulse text-blue-400 font-medium">Synchronizing Temporal Data...</div>
            </div>
          )}

          {/* Events Section */}
          <div className="border-b border-white/10 pb-8">
            <div className="sticky left-0 w-48 bg-neutral-950/90 backdrop-blur border-r border-white/5 z-10 p-4 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Events</h2>
            </div>
            
            <div className="relative pl-48 pt-2" style={{ width: `calc(192px + ${daysInMonth.length * DAY_WIDTH}px)`, minHeight: '100px' }}>
              {/* Vertical Day Lines */}
              <div className="absolute inset-0 left-48 flex pointer-events-none">
                {daysInMonth.map((_, i) => (
                  <div key={i} className="border-r border-white/5 h-full" style={{ width: `${DAY_WIDTH}px` }} />
                ))}
              </div>

              {/* Event Bars */}
              <div className="relative z-10 space-y-2 py-2">
                {events.map((event) => {
                  const styles = getPositionStyles(event.periodStart, event.periodEnd);
                  return (
                    <div key={event.bookingId} className="relative h-12 flex items-center group">
                      <div className="absolute left-0 h-full w-full opacity-0 hover:opacity-100 bg-white/5 transition-opacity pointer-events-none" />
                      <div 
                        className="absolute h-8 rounded-md bg-blue-500/20 border border-blue-500/40 flex flex-col justify-center px-3 overflow-hidden"
                        style={styles}
                        title={`${event.eventName} - ${event.customerName}`}
                      >
                        <div className="text-xs font-medium text-blue-100 truncate">{event.eventName}</div>
                        <div className="text-[10px] text-blue-300 truncate">{event.status}</div>
                      </div>
                    </div>
                  );
                })}
                {events.length === 0 && !loading && (
                  <div className="px-6 py-8 text-sm text-neutral-500">No events scheduled in this period.</div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Timeline Section */}
          <div className="pb-8 bg-neutral-900">
            <div className="sticky left-0 w-48 bg-neutral-950/90 backdrop-blur border-r border-white/5 z-20 p-4 shadow-[4px_0_12px_rgba(0,0,0,0.5)] flex flex-col justify-center">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Inventory Pressure</h2>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Items</option>
                {inventoryItemsList.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="relative pl-48" style={{ width: `calc(192px + ${daysInMonth.length * DAY_WIDTH}px)`, minHeight: '200px' }}>
              {/* Vertical Day Lines */}
              <div className="absolute inset-0 left-48 flex pointer-events-none">
                {daysInMonth.map((_, i) => (
                  <div key={i} className="border-r border-white/5 h-full" style={{ width: `${DAY_WIDTH}px` }} />
                ))}
              </div>

              {/* Inventory Item Rows */}
              <div className="relative z-10 divide-y divide-white/5">
                {inventoryResponse?.items.map((item) => (
                  <div key={item.inventoryItemId} className="relative flex group">
                    {/* Sticky Label (Inside the row so it aligns perfectly) */}
                    <div className="sticky left-0 w-48 bg-neutral-900 group-hover:bg-neutral-800 transition-colors border-r border-white/5 z-20 p-4 flex flex-col justify-center shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                      <div className="text-sm font-medium text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-neutral-500">Usable: {item.usableQty}</div>
                    </div>

                    {/* Timeline Track */}
                    <div className="relative h-20 group-hover:bg-neutral-800/50 transition-colors" style={{ width: `${daysInMonth.length * DAY_WIDTH}px` }}>
                      
                      {/* Pressure Segments rendered as day blocks */}
                      <div className="absolute inset-0 flex">
                        {item.pressureSegments.map((segment, i) => {
                          if (segment.reservedQty === 0) return (
                            <div key={i} style={{ width: `${DAY_WIDTH}px` }} className="flex-shrink-0" />
                          );

                          let bgColor = 'bg-blue-500/20';
                          let barColor = 'bg-blue-500';
                          let textColor = 'text-blue-300';
                          let label = '';

                          if (segment.pressure === 'FULL') {
                            bgColor = 'bg-yellow-500/20';
                            barColor = 'bg-yellow-500';
                            textColor = 'text-yellow-400';
                            label = 'FULL';
                          } else if (segment.pressure === 'SHORTAGE') {
                            bgColor = 'bg-red-500/20';
                            barColor = 'bg-red-500';
                            textColor = 'text-red-400';
                            label = 'SHORTAGE';
                          }

                          // Width of the actual colored bar (percentage of usable filled)
                          const fillPercent = item.usableQty > 0 
                            ? Math.min(100, (segment.reservedQty / item.usableQty) * 100)
                            : (segment.reservedQty > 0 ? 100 : 0);

                          return (
                            <div 
                              key={i} 
                              style={{ width: `${DAY_WIDTH}px` }} 
                              className="flex-shrink-0 p-1 flex flex-col justify-center items-center relative group/cell"
                            >
                              <div className={`w-[90%] h-6 ${bgColor} rounded overflow-hidden relative border border-white/5`}>
                                <div className={`absolute top-0 left-0 bottom-0 ${barColor} opacity-70`} style={{ width: `${fillPercent}%` }} />
                              </div>
                              <div className={`text-[10px] font-medium mt-1 ${textColor}`}>
                                {segment.reservedQty}/{item.usableQty} {label}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                ))}
                {inventoryResponse?.items.length === 0 && !loading && (
                  <div className="px-6 py-8 text-sm text-neutral-500 ml-48">No inventory items found.</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
