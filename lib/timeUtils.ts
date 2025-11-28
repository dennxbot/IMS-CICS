// Philippine Standard Time (PST) utilities
// PST is UTC+8

export function getPhilippineTime(): Date {
  const now = new Date();
  // Convert to Philippine time (UTC+8)
  const philippineTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return philippineTime;
}

export function formatPhilippineDate(date: Date = new Date()): string {
  const philippineTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  return philippineTime.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function formatPhilippineTime12Hour(date: Date = new Date()): string {
  const philippineTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));

  // Get hours, minutes, seconds in Philippine time
  const hours = philippineTime.getUTCHours();
  const minutes = philippineTime.getUTCMinutes();
  const seconds = philippineTime.getUTCSeconds();

  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  // Format with leading zeros
  const formattedHours = displayHours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${period}`;
}

export function getPhilippineDayOfWeek(date: Date = new Date()): number {
  const philippineTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  const day = philippineTime.getUTCDay(); // 0=Sunday, 1=Monday, etc.
  return day === 0 ? 7 : day; // Convert to 1-7 format (Monday=1, Sunday=7)
}

export function formatPhilippineDateDisplay(date: Date = new Date()): string {
  const philippineTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));

  // Format as MM/DD/YYYY for Philippine time
  const month = (philippineTime.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = philippineTime.getUTCDate().toString().padStart(2, '0');
  const year = philippineTime.getUTCFullYear();

  return `${month}/${day}/${year}`;
}

export function formatPhilippineTime12HourFromString(timeString: string | null): string {
  if (!timeString) return '-';

  // Parse the time string (assuming HH:MM:SS format)
  const [hours, minutes, seconds] = timeString.split(':').map(Number);

  // Create a date object with the time (using current date for timezone conversion)
  const now = new Date();
  const timeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);

  // Convert to Philippine time
  const philippineTime = new Date(timeDate.getTime() + (8 * 60 * 60 * 1000));

  // Get Philippine time components
  const philHours = philippineTime.getUTCHours();
  const philMinutes = philippineTime.getUTCMinutes();

  // Convert to 12-hour format
  const period = philHours >= 12 ? 'PM' : 'AM';
  const displayHours = philHours === 0 ? 12 : philHours > 12 ? philHours - 12 : philHours;

  // Format with leading zeros
  const formattedHours = displayHours.toString().padStart(2, '0');
  const formattedMinutes = philMinutes.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes} ${period}`;
}

export function parsePhilippineTime(dateStr: string, timeStr: string): Date {
  // Parse the Philippine date and time
  const [year, month, day] = dateStr.split('-').map(Number);

  // Parse 12-hour time format (HH:MM:SS AM/PM)
  // Parse 12-hour time format (HH:MM:SS AM/PM or HH:MM AM/PM)
  // Parse time format (HH:MM:SS AM/PM, HH:MM AM/PM, or HH:MM:SS 24h)
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
  if (!timeMatch) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:MM:SS [AM/PM]`);
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  const period = timeMatch[4] ? timeMatch[4].toUpperCase() : null;

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  // Create Philippine time (UTC+8)
  const philippineTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

  // Convert back to UTC for storage
  const utcTime = new Date(philippineTime.getTime() - (8 * 60 * 60 * 1000));

  return utcTime;
}