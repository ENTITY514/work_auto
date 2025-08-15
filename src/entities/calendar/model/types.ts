// src/entities/calendar/model/types.ts

export interface QuarterDates {
  start: string; // Даты храним в формате YYYY-MM-DD
  end: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

// НОВЫЙ ТИП: Для каникулярных периодов с датой начала и конца
export interface DateRangeHoliday {
  id: string;
  start: string;
  end: string;
  name: string;
}

// ОБНОВЛЕННЫЙ ИНТЕРФЕЙС: Добавлено поле для доп. каникул
export interface CalendarProfile {
  id: string;
  name: string;
  quarters: {
    q1: QuarterDates;
    q2: QuarterDates;
    q3: QuarterDates;
    q4: QuarterDates;
  };
  additionalHolidays: DateRangeHoliday[]; // <--- НОВОЕ ПОЛЕ
}

// Состояние остается без изменений в структуре
export interface CalendarState {
  profiles: CalendarProfile[];
  activeProfileId: string | null;
  holidays: Holiday[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
