import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";
import { transformTupToKtp, renumberPlan } from "./lib";
import { KtpPlan, IKtpLesson, LessonRowType, DayOfWeek, ILessonObjective } from "./types";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { CalendarProfile, Holiday } from "../../calendar/model/types";

const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface SavedKtp {
  id: string;
  name: string;
  className: string;
  plan: KtpPlan;
  totalHours: number;
  quarterWorkHours: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

interface KtpEditorState {
  plan: KtpPlan;
  sourceTupName: string;
  className: string;
  totalHours: number;
  quarterWorkHours: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  savedKtps: SavedKtp[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  autofillError: string | null;
}

const initialState: KtpEditorState = {
  plan: [],
  sourceTupName: "",
  className: "",
  totalHours: 0,
  quarterWorkHours: { q1: 0, q2: 0, q3: 0, q4: 0 },
  savedKtps: [],
  status: "idle",
  error: null,
  autofillError: null,
};

export const createKtpFromTup = createAsyncThunk<
  SavedKtp,
  string,
  { state: RootState }
>("ktpEditor/createFromTup", (tupId, { getState, rejectWithValue }) => {
  const state = getState();
  const allTups = state.academicPlan.tupList;
  const tupIndex = parseInt(tupId, 10);

  const sourceTup = allTups[tupIndex];
  if (!sourceTup) {
    return rejectWithValue("Исходный ТУП не найден.");
  }
  const transformedPlan = transformTupToKtp(sourceTup.planData);
  const newKtp: SavedKtp = {
    id: uuidv4(),
    name: sourceTup.name,
    className: "", // Default class name
    plan: transformedPlan,
    totalHours: 0,
    quarterWorkHours: { q1: 0, q2: 0, q3: 0, q4: 0 },
  };

  try {
    const ktps = JSON.parse(localStorage.getItem('ktps') || '[]') as SavedKtp[];
    ktps.push(newKtp);
    localStorage.setItem('ktps', JSON.stringify(ktps));
    return newKtp;
  } catch (error) {
    console.error("Failed to save KTP to localStorage", error);
    return rejectWithValue("Ошибка сохранения КТП");
  }
});

const ktpEditorSlice = createSlice({
  name: "ktpEditor",
  initialState,
  reducers: {
    setClassName(state, action: PayloadAction<string>) {
      state.className = action.payload;
    },
    updateLesson(
      state,
      action: PayloadAction<{
        id: string;
        field: keyof IKtpLesson;
        value: string | number | ILessonObjective[];
      }> 
    ) {
      const { id, field, value } = action.payload;
      const lesson = state.plan.find((l) => l.id === id);
      if (lesson) {
        (lesson as any)[field] = value;
      }
    },

    addHour(state, action: PayloadAction<{ lessonId: string }>) {
      const lessonIndex = state.plan.findIndex(
        (l) => l.id === action.payload.lessonId
      );
      if (lessonIndex === -1) return;

      const originalLesson = state.plan[lessonIndex];
      const newHour: IKtpLesson = {
        ...originalLesson,
        id: `${originalLesson.id}-hour-${Date.now()}`,
        date: "",
        notes: "",
      };

      state.plan.splice(lessonIndex + 1, 0, newHour);
      state.plan = renumberPlan(state.plan);
    },

    deleteLesson(state, action: PayloadAction<{ lessonId: string }>) {
      state.plan = state.plan.filter((l) => l.id !== action.payload.lessonId);
      state.plan = renumberPlan(state.plan);
    },

    reorderPlan(
      state,
      action: PayloadAction<{ activeId: string; overId: string }>
    ) {
      const { activeId, overId } = action.payload;
      const oldIndex = state.plan.findIndex((item) => item.id === activeId);
      const newIndex = state.plan.findIndex((item) => item.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        state.plan = renumberPlan(arrayMove(state.plan, oldIndex, newIndex));
      }
    },

    mergeObjectives(
      state,
      action: PayloadAction<{ sourceLessonId: string; targetLessonId: string }>
    ) {
      const { sourceLessonId, targetLessonId } = action.payload;
      const sourceLesson = state.plan.find((l) => l.id === sourceLessonId);
      const targetLesson = state.plan.find((l) => l.id === targetLessonId);

      if (sourceLesson && targetLesson) {
        targetLesson.objectives.push(...sourceLesson.objectives);
        state.plan = state.plan.filter((l) => l.id !== sourceLessonId);
        state.plan = renumberPlan(state.plan);
      }
    },

    splitAllObjectives(state, action: PayloadAction<{ lessonId: string }>) {
      const { lessonId } = action.payload;
      const lessonIndex = state.plan.findIndex((l) => l.id === lessonId);
      if (lessonIndex === -1) return;

      const originalLesson = state.plan[lessonIndex];
      if (originalLesson.objectives.length < 2) return;

      const objectivesToSplit = originalLesson.objectives.slice(1);
      originalLesson.objectives = [originalLesson.objectives[0]];

      const newLessons = objectivesToSplit.map((objective) => ({
        ...originalLesson,
        id: uuidv4(),
        objectives: [objective],
      }));

      state.plan.splice(lessonIndex + 1, 0, ...newLessons);
      state.plan = renumberPlan(state.plan);
    },

    addSor(state, action: PayloadAction<{ lessonId: string }>) {
      const lastLessonIndex = state.plan.findIndex(
        (l) => l.id === action.payload.lessonId
      );
      if (lastLessonIndex === -1) {
        console.warn("Last lesson of the section not found.");
        return;
      }

      const sectionLastLesson = state.plan[lastLessonIndex];

      const totalSorCount = state.plan.filter(
        (l) => l.rowType === LessonRowType.SOR
      ).length;

      const newSor: IKtpLesson = {
        ...sectionLastLesson,
        id: uuidv4(),
        lessonTopic: `${sectionLastLesson.lessonTopic}\nСОР №${totalSorCount + 1} по разделу "${ 
          sectionLastLesson.sectionName
        }"`, 
        objectives: sectionLastLesson.objectives,
        hours: 1,
        date: "",
        notes: "",
        rowType: LessonRowType.SOR,
      };

      const newHour: IKtpLesson = { ...sectionLastLesson, id: uuidv4() };

      const newIndex = lastLessonIndex + 1;
      state.plan.splice(newIndex, 0, newSor, newHour);
      state.plan = renumberPlan(state.plan);
    },

    autofillDates(
      state,
      action: PayloadAction<{
        startQuarter: keyof CalendarProfile["quarters"];
        selectedDays: DayOfWeek[];
        calendarProfile: CalendarProfile;
        holidays: Holiday[];
      }> 
    ) {
      const { startQuarter, selectedDays, calendarProfile, holidays } =
        action.payload;

      state.autofillError = null;

      const allHolidays = new Set([
        ...holidays.map((h) => h.date),
        ...calendarProfile.additionalHolidays.flatMap((h) => {
          const dates = [];
          const start = new Date(h.start + 'T00:00:00');
          const end = new Date(h.end + 'T00:00:00');
          let currentDate = new Date(start);
          while (currentDate <= end) {
            dates.push(toYYYYMMDD(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
          return dates;
        }),
      ]);

      const isHoliday = (date: Date) => {
        const dateString = toYYYYMMDD(date);
        return allHolidays.has(dateString);
      };

      const dayMap: { [key: number]: DayOfWeek } = {
        0: "воскресенье",
        1: "понедельник",
        2: "вторник",
        3: "среда",
        4: "четверг",
        5: "пятница",
        6: "суббота",
      };

      const allQuarters = Object.values(calendarProfile.quarters);
      const startQuarterIndex = Object.keys(calendarProfile.quarters).findIndex(
        (q) => q === startQuarter
      );

      const relevantQuarters = allQuarters.slice(startQuarterIndex);

      let totalLessonsToFill = 0;
      let isFilling = false;
      state.plan.forEach((lesson) => {
        if (
          lesson.sectionName.includes("четверть") &&
          lesson.sectionName.includes(startQuarter.charAt(1))
        ) {
          isFilling = true;
        }
        if (isFilling && lesson.rowType !== LessonRowType.QUARTER_HEADER) {
          totalLessonsToFill++;
        }
      });

      let totalAvailableDays = 0;
      relevantQuarters.forEach((quarter) => {
        const start = new Date(quarter.start + 'T00:00:00');
        const end = new Date(quarter.end + 'T00:00:00');

        const tempDate = new Date(start);
        while (tempDate <= end) {
          const dayOfWeek = dayMap[tempDate.getDay()];
          const isSelectedDay = selectedDays.includes(dayOfWeek);

          if (isSelectedDay && !isHoliday(tempDate)) {
            totalAvailableDays++;
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }
      });

      if (totalLessonsToFill > totalAvailableDays) {
        console.log(totalLessonsToFill, totalAvailableDays);
        state.autofillError = `Недостаточно учебных дней для автозаполнения. Не хватает ${ 
          totalLessonsToFill - totalAvailableDays
        } дней.`;
        return;
      }

      if (totalLessonsToFill < totalAvailableDays) {
        console.log(totalLessonsToFill, totalAvailableDays);
        state.autofillError = `Слишком много учебных дней для автозаполнения. Лишних ${ 
          totalAvailableDays - totalLessonsToFill
        } дней.`;
        return;
      }

      let currentDate = new Date(calendarProfile.quarters[startQuarter].start + 'T00:00:00');
      let lessonCounter = 0;

      for (const lesson of state.plan) {
        if (lesson.rowType === LessonRowType.QUARTER_HEADER) {
          if (lesson.sectionName.includes(startQuarter.charAt(1))) {
            isFilling = true;
          } else {
            isFilling = false;
          }
          continue;
        }

        if (isFilling) {
          let foundDate = false;
          while (!foundDate) {
            const dayOfWeek = dayMap[currentDate.getDay()];
            const isSelectedDay = selectedDays.includes(dayOfWeek);
            const isDateHoliday = isHoliday(currentDate);

            if (isSelectedDay && !isDateHoliday) {
              lesson.date = toYYYYMMDD(currentDate);
              foundDate = true;
              lessonCounter++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    },
    clearAutofillError(state) {
      state.autofillError = null;
    },
    setTotalHours(state, action: PayloadAction<number>) {
      state.totalHours = action.payload;
    },
    setQuarterWorkHours(state, action: PayloadAction<{ quarter: keyof KtpEditorState['quarterWorkHours'], hours: number }>) {
      state.quarterWorkHours[action.payload.quarter] = action.payload.hours;
    },
    saveKtpToLocalStorage(state, action: PayloadAction<{ name: string; id?: string; className: string; }>) {
      try {
        const { name, id, className } = action.payload;
        const ktps = JSON.parse(localStorage.getItem('ktps') || '[]') as SavedKtp[];
        const ktpData: SavedKtp = {
          id: id || uuidv4(),
          name,
          className,
          plan: state.plan,
          totalHours: state.totalHours,
          quarterWorkHours: state.quarterWorkHours,
        };

        const existingIndex = ktps.findIndex(k => k.id === ktpData.id);
        if (existingIndex !== -1) {
          ktps[existingIndex] = ktpData;
        } else {
          ktps.push(ktpData);
        }

        localStorage.setItem('ktps', JSON.stringify(ktps));
        state.savedKtps = ktps;
      } catch (error) {
        console.error("Failed to save KTP to localStorage", error);
      }
    },
    loadKtpsFromLocalStorage(state) {
      try {
        const ktps = JSON.parse(localStorage.getItem('ktps') || '[]') as SavedKtp[];
        state.savedKtps = ktps;
      } catch (error) {
        console.error("Failed to load KTPs from localStorage", error);
      }
    },
    setKtpForEditing(state, action: PayloadAction<string>) {
      const ktpId = action.payload;
      const ktp = state.savedKtps.find(k => k.id === ktpId);
      if (ktp) {
        state.plan = ktp.plan;
        state.totalHours = ktp.totalHours;
        state.quarterWorkHours = ktp.quarterWorkHours;
        state.sourceTupName = ktp.name;
        state.className = ktp.className;
      }
    },
    updateKtpName(state, action: PayloadAction<{ id: string; name: string }>) {
      try {
        const { id, name } = action.payload;
        const ktps = JSON.parse(localStorage.getItem('ktps') || '[]') as SavedKtp[];
        const ktpIndex = ktps.findIndex(k => k.id === id);
        if (ktpIndex !== -1) {
          ktps[ktpIndex].name = name;
          localStorage.setItem('ktps', JSON.stringify(ktps));
          state.savedKtps = ktps;
        }
      } catch (error) {
        console.error("Failed to update KTP name in localStorage", error);
      }
    },
    deleteKtp(state, action: PayloadAction<string>) {
      try {
        const ktpId = action.payload;
        let ktps = JSON.parse(localStorage.getItem('ktps') || '[]') as SavedKtp[];
        ktps = ktps.filter(k => k.id !== ktpId);
        localStorage.setItem('ktps', JSON.stringify(ktps));
        state.savedKtps = ktps;
      } catch (error) {
        console.error("Failed to delete KTP from localStorage", error);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(createKtpFromTup.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createKtpFromTup.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.plan = action.payload.plan;
        state.sourceTupName = action.payload.name;
        state.className = action.payload.className;
        state.savedKtps.push(action.payload);
      })
      .addCase(createKtpFromTup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const {
  setClassName,
  updateLesson,
  addHour,
  deleteLesson,
  reorderPlan,
  mergeObjectives,
  splitAllObjectives,
  addSor,
  autofillDates,
  clearAutofillError,
  setTotalHours,
  setQuarterWorkHours,
  saveKtpToLocalStorage,
  loadKtpsFromLocalStorage,
  setKtpForEditing,
  updateKtpName,
  deleteKtp,
} = ktpEditorSlice.actions;

export const ktpEditorReducer = ktpEditorSlice.reducer;
