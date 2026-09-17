import { describe, it, expect } from 'vitest';
import { calculateDaySummary, calculateAllStudentStats, type AttendanceRecord, type StudentInfo } from '../../src/domain/stats';

describe('Domain: stats', () => {
  const mockStudents = new Map<string, StudentInfo>([
    ['s1', { id: 's1', gender: 'F', year: '1A', active: true }],
    ['s2', { id: 's2', gender: 'M', year: '1A', active: true }],
    ['s3', { id: 's3', gender: 'F', year: '2B', active: true }],
  ]);

  const mockAttendances: AttendanceRecord[] = [
    { id: 'a1', studentId: 's1', date: '2026-09-17', type: 'presence', present: true, markedAt: 1000, deviceId: 'dev1', updatedAt: 1000, dirty: 0 },
    { id: 'a2', studentId: 's2', date: '2026-09-17', type: 'presence', present: true, markedAt: 1005, deviceId: 'dev1', updatedAt: 1005, dirty: 0 },
    { id: 'a3', studentId: 's3', date: '2026-09-17', type: 'course', present: true, markedAt: 1010, deviceId: 'dev1', updatedAt: 1010, dirty: 0 },
    { id: 'a4', studentId: 's1', date: '2026-09-17', type: 'course', present: false, markedAt: 1015, deviceId: 'dev1', updatedAt: 1015, dirty: 0 }, // Annulé
  ];

  it('calcule correctement le résumé du jour pour les présences', () => {
    const summary = calculateDaySummary(mockAttendances, mockStudents, 'presence');
    expect(summary.total).toBe(2);
    expect(summary.girls).toBe(1);
    expect(summary.boys).toBe(1);
    expect(summary.byYear['1A'].total).toBe(2);
  });

  it('calcule correctement la synthèse par élève', () => {
    const statsMap = calculateAllStudentStats(mockAttendances);
    expect(statsMap.get('s1')?.presences).toBe(1);
    expect(statsMap.get('s1')?.courses).toBe(0);
    expect(statsMap.get('s3')?.courses).toBe(1);
  });
});
