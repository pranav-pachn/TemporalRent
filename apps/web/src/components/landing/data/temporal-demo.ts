export const timelinePosition = (
  startMinutes: number,
  endMinutes: number,
  timelineStart: number,
  timelineEnd: number
) => ({
  left: `${((startMinutes - timelineStart) / (timelineEnd - timelineStart)) * 100}%`,
  width: `${((endMinutes - startMinutes) / (timelineEnd - timelineStart)) * 100}%`,
});

export const temporalDemo = {
  scenario: "SAMPLE EVENT",
  timelineBounds: {
    // 24-hour timeline from Nov 12 2:00 PM to Nov 13 2:00 PM (minutes from Nov 12 00:00)
    startMinutes: 14 * 60, // 840 (Nov 12, 2:00 PM)
    endMinutes: (24 + 14) * 60, // 2280 (Nov 13, 2:00 PM)
    midnightMinutes: 24 * 60, // 1440 (Midnight transition)
  },
  bookingA: {
    name: "Booking A",
    eventName: "Wedding Reception",
    event: {
      date: "Nov 12",
      start: "6:00 PM",
      end: "11:00 PM",
      startMinutes: 18 * 60, // 1080
      endMinutes: 23 * 60, // 1380
      label: "Event",
      display: "Nov 12 · 6:00 PM → 11:00 PM",
    },
    buffer: {
      before: "2h",
      after: "12h",
      label: "2h before · 12h after",
    },
    operational: {
      startDate: "Nov 12",
      start: "4:00 PM",
      endDate: "Nov 13",
      end: "11:00 AM",
      startMinutes: 16 * 60, // 960
      endMinutes: (24 + 11) * 60, // 2100
      label: "Operational reservation",
      display: "Nov 12 · 4:00 PM → Nov 13 · 11:00 AM",
    },
  },
  bookingB: {
    name: "Booking B",
    eventName: "Corporate Event",
    event: {
      date: "Nov 13",
      start: "9:00 AM",
      end: "12:00 PM",
      startMinutes: (24 + 9) * 60, // 1980
      endMinutes: (24 + 12) * 60, // 2160
      label: "Event",
      display: "Nov 13 · 9:00 AM → 12:00 PM",
    },
  },
  inventory: {
    primaryItem: {
      name: "VIP Sofa",
      totalCapacity: 10,
      bookingACommitted: 10, // 10 / 10 reserved by Booking A
      bookingBRequired: 4, // Booking B needs 4
      availableDuringOverlap: 0, // 0 remaining
      shortage: 4, // 4 units short
    },
    secondaryItem: {
      name: "Urli",
      bookingACommitted: 6,
      totalCapacity: 6,
    },
  },
};

