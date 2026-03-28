import { create } from 'zustand';
import { api } from '../api/client';

export const useAttendanceStore = create((set) => ({
  records: [],
  salary: null,
  async generate(userId, year, month) {
    const { data } = await api.post('/attendance/generate', { userId, year, month });
    set({ records: data.records });
  },
  async calculateSalary(userId, year, month, deductions = 0) {
    const { data } = await api.post('/salary/calculate', { userId, year, month, deductions });
    set({ salary: data });
  }
}));
