import React, { useState, useEffect, useMemo } from 'react';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export function DateTimePicker({ value, onChange, className = '', id }: DateTimePickerProps) {
  // value is expected to be in "YYYY-MM-DDThh:mm" format or empty

  const initialDate = value ? value.split('T')[0] : '';
  const initialTime = value ? value.split('T')[1] : '';
  
  let initHour = '12';
  let initMinute = '00';
  let initAmPm = 'AM';

  if (initialTime) {
    const [h, m] = initialTime.split(':');
    let hourNum = parseInt(h, 10);
    if (!isNaN(hourNum)) {
      if (hourNum >= 12) {
        initAmPm = 'PM';
        if (hourNum > 12) hourNum -= 12;
      } else {
        initAmPm = 'AM';
        if (hourNum === 0) hourNum = 12;
      }
      initHour = hourNum.toString().padStart(2, '0');
    }
    if (m) initMinute = m.substring(0, 2);
  }

  const [dateStr, setDateStr] = useState(initialDate);
  const [hourStr, setHourStr] = useState(initHour);
  const [minuteStr, setMinuteStr] = useState(initMinute);
  const [amPmStr, setAmPmStr] = useState(initAmPm);

  // When props change from outside (if they do), update state
  useEffect(() => {
    if (value) {
      const d = value.split('T')[0];
      const t = value.split('T')[1];
      if (d !== dateStr) setDateStr(d);
      if (t) {
        const [h, m] = t.split(':');
        let hourNum = parseInt(h, 10);
        if (!isNaN(hourNum)) {
          let ampm = 'AM';
          if (hourNum >= 12) {
            ampm = 'PM';
            if (hourNum > 12) hourNum -= 12;
          } else {
            if (hourNum === 0) hourNum = 12;
          }
          const hs = hourNum.toString().padStart(2, '0');
          if (hs !== hourStr) setHourStr(hs);
          if (ampm !== amPmStr) setAmPmStr(ampm);
        }
        if (m && m.substring(0,2) !== minuteStr) setMinuteStr(m.substring(0, 2));
      }
    }
  }, [value]); // intentionally omitting internal state deps to prevent circular loops

  useEffect(() => {
    if (!dateStr) {
      onChange('');
      return;
    }
    
    let h24 = parseInt(hourStr, 10);
    if (amPmStr === 'PM' && h24 < 12) {
      h24 += 12;
    } else if (amPmStr === 'AM' && h24 === 12) {
      h24 = 0;
    }
    
    const h24Str = h24.toString().padStart(2, '0');
    const newValue = `${dateStr}T${h24Str}:${minuteStr}`;
    
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [dateStr, hourStr, minuteStr, amPmStr]);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  // Generating minutes in intervals of 5 for cleaner UI, or 0-59
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <input
        id={id}
        type="date"
        value={dateStr}
        onChange={(e) => setDateStr(e.target.value)}
        className="bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1 min-w-[140px]"
      />
      <div className="flex items-center gap-1 bg-neutral-950 border border-white/10 rounded-lg px-2 py-2">
        <select
          value={hourStr}
          onChange={(e) => setHourStr(e.target.value)}
          className="bg-transparent text-white focus:outline-none appearance-none cursor-pointer text-center"
        >
          {hours.map(h => (
            <option key={h} value={h} className="bg-neutral-900">{h}</option>
          ))}
        </select>
        <span className="text-white/50 font-bold">:</span>
        <select
          value={minuteStr}
          onChange={(e) => setMinuteStr(e.target.value)}
          className="bg-transparent text-white focus:outline-none appearance-none cursor-pointer text-center"
        >
          {minutes.map(m => (
            <option key={m} value={m} className="bg-neutral-900">{m}</option>
          ))}
        </select>
        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
        <select
          value={amPmStr}
          onChange={(e) => setAmPmStr(e.target.value)}
          className="bg-transparent text-white focus:outline-none appearance-none cursor-pointer font-medium"
        >
          <option value="AM" className="bg-neutral-900">AM</option>
          <option value="PM" className="bg-neutral-900">PM</option>
        </select>
      </div>
    </div>
  );
}
