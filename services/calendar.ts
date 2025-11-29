import { ProtocolDay } from '../types';
import { addPoints, POINTS } from './gamification';

export const downloadCalendarIcs = (protocol: ProtocolDay[], startDate: string) => {
  const start = new Date(startDate);
  
  let icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gloova.AI//Hair Protocol//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  protocol.forEach(day => {
    // Calculate date for this day
    // Note: startDate is Day 1
    const eventDate = new Date(start);
    eventDate.setDate(start.getDate() + (day.day - 1));
    
    // Format date YYYYMMDD for all-day event
    const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('T')[0];
    
    icsContent += 
`BEGIN:VEVENT
SUMMARY:Gloova - ${day.type} (Dia ${day.day})
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${dateStr}
DESCRIPTION:${day.instruction}
STATUS:CONFIRMED
END:VEVENT
`;
  });

  icsContent += "END:VCALENDAR";

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'gloova_protocolo.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Award points for syncing
  addPoints(POINTS.CALENDAR_SYNC);
};

export const downloadSingleReminderIcs = (
  dayOffset: number,
  protocolType: string,
  baseDate: string,
  timeStr: string,
  note: string
) => {
  const start = new Date(baseDate);
  const eventDate = new Date(start);
  eventDate.setDate(start.getDate() + (dayOffset - 1));

  // Set time
  const [hours, minutes] = timeStr.split(':').map(Number);
  eventDate.setHours(hours, minutes, 0);

  // End time (30 mins duration default)
  const endDate = new Date(eventDate);
  endDate.setMinutes(endDate.getMinutes() + 30);

  // Format date string for ICS (YYYYMMDDTHHmmSS) - Local time (Floating)
  const formatDateTime = (date: Date) => {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gloova.AI//Custom Reminder//PT
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:Gloova - Dia ${dayOffset}: ${protocolType}
DTSTART:${formatDateTime(eventDate)}
DTEND:${formatDateTime(endDate)}
DESCRIPTION:${note || 'Lembrete do protocolo capilar.'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `gloova_lembrete_dia_${dayOffset}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};