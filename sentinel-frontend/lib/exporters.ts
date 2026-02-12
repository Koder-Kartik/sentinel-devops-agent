import { LogEntry } from "@/hooks/useLogs";

/**
 * Converts log entries to CSV format
 * Properly escapes quotes and handles special characters
 */
export function convertToCSV(logs: LogEntry[]): string {
  const headers = ['timestamp', 'level', 'service', 'message'];
  
  const rows = logs.map(log => [
    log.timestamp,
    log.level,
    log.service,
    `"${log.message.replace(/"/g, '""')}"` // Escape quotes in CSV
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Converts log entries to JSON format
 * Pretty-printed with 2-space indentation
 */
export function convertToJSON(logs: LogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}
