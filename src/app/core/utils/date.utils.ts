/**
 * Date utility functions for handling DD/MM/YYYY string format
 * used throughout the application
 */
export class DateUtils {
  
  /**
   * Converts a DD/MM/YYYY string to a Date object
   * @param dateString - Date string in DD/MM/YYYY format
   * @returns Date object or null if invalid
   */
  static parseStringToDate(dateString: string | Date | null | undefined): Date | null {
    if (!dateString) return null;
    
    // Check if it's already a Date object
    if (dateString instanceof Date) return dateString;
    
    // Parse DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (day && month && year && day <= 31 && month <= 12 && year > 1900) {
        return new Date(year, month - 1, day);
      }
    }
    
    // Fallback for other formats (ISO, etc.)
    try {
      const fallbackDate = new Date(dateString);
      return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    } catch {
      return null;
    }
  }

  /**
   * Converts a Date object to DD/MM/YYYY string
   * @param date - Date object to convert
   * @returns Date string in DD/MM/YYYY format
   */
  static dateToString(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    // If it's already a string in DD/MM/YYYY format, return as is
    if (typeof date === 'string') {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (dateRegex.test(date)) {
        return date;
      }
      // If it's another string format, convert to Date first
      date = new Date(date);
    }
    
    if (date instanceof Date && !isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return '';
  }

  /**
   * Validates if a string is in DD/MM/YYYY format
   * @param dateString - String to validate
   * @returns true if valid DD/MM/YYYY format
   */
  static isValidDateString(dateString: string): boolean {
    if (!dateString) return false;
    
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    
    // Basic validation
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
      return false;
    }
    
    // Check if the date is actually valid (handles leap years, month lengths, etc.)
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  }

  /**
   * Gets today's date as DD/MM/YYYY string
   * @returns Today's date in DD/MM/YYYY format
   */
  static getTodayString(): string {
    return DateUtils.dateToString(new Date());
  }

  /**
   * Compares two dates (can be strings or Date objects)
   * @param date1 - First date to compare
   * @param date2 - Second date to compare
   * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2, null if invalid
   */
  static compareDates(
    date1: string | Date | null | undefined, 
    date2: string | Date | null | undefined
  ): number | null {
    const d1 = DateUtils.parseStringToDate(date1);
    const d2 = DateUtils.parseStringToDate(date2);
    
    if (!d1 || !d2) return null;
    
    if (d1.getTime() < d2.getTime()) return -1;
    if (d1.getTime() > d2.getTime()) return 1;
    return 0;
  }

  /**
   * Checks if two dates are the same day
   * @param date1 - First date to compare
   * @param date2 - Second date to compare
   * @returns true if same day, false otherwise
   */
  static isSameDay(
    date1: string | Date | null | undefined, 
    date2: string | Date | null | undefined
  ): boolean {
    const d1 = DateUtils.parseStringToDate(date1);
    const d2 = DateUtils.parseStringToDate(date2);
    
    if (!d1 || !d2) return false;
    
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }
}
