import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";
import { transformTupToKtp, renumberPlan } from "./lib";
import { KtpPlan, IKtpLesson, LessonRowType, DayOfWeek } from "./types";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { CalendarProfile, Holiday } from "../../calendar/model/types";

interface KtpEditorState {
  plan: KtpPlan;
  sourceTupName: string;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: KtpEditorState = {
  plan: [],
  sourceTupName: "",
  status: "idle",
  error: null,
};

export const initKtpPlan = createAsyncThunk<
  { plan: KtpPlan; name: string },
  string,
  { state: RootState }
>("ktpEditor/init", (tupId, { getState, rejectWithValue }) => {
  const state = getState();
  const allTups = state.academicPlan.tupList;
  const tupIndex = parseInt(tupId, 10);

  const sourceTup = allTups[tupIndex];
  if (!sourceTup) {
    return rejectWithValue("Исходный ТУП не найден.");
  }
  const transformedPlan = transformTupToKtp(sourceTup.planData);
  return { plan: transformedPlan, name: sourceTup.name };
});

const ktpEditorSlice = createSlice({
  name: "ktpEditor",
  initialState,
  reducers: {
    updateLesson(
      state,
      action: PayloadAction<{
        id: string;
        field: keyof IKtpLesson;
        value: string | number;
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
      const lessonToDelete = state.plan.find(
        (l) => l.id === action.payload.lessonId
      );
      if (!lessonToDelete) {
        return;
      }
      const lessonsWithSameObjective = state.plan.filter(
        (l) => l.objectiveId === lessonToDelete.objectiveId
      );

      if (lessonsWithSameObjective.length <= 1) {
        console.warn(
          "Cannot delete the last remaining lesson for an objective."
        );
        return;
      }

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
        lessonTopic: `СОР №${totalSorCount + 1} по разделу "${
          sectionLastLesson.sectionName
        }"`,
        objectiveId: sectionLastLesson.objectiveId,
        objectiveDescription: sectionLastLesson.objectiveDescription,
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

      const allHolidays = new Set([
        ...holidays.map((h) => h.date),
        ...calendarProfile.additionalHolidays.flatMap((h) => {
          const dates = [];
          const start = new Date(h.start);
          const end = new Date(h.end);
          for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split("T")[0]);
          }
          return dates;
        }),
      ]);

      const isHoliday = (date: Date) => {
        const dateString = date.toISOString().split("T")[0];
        return allHolidays.has(dateString);
      };

      const quarterName = `${startQuarter.charAt(1)} четверть`;

      let startPlanIndex = -1;
      for (let i = 0; i < state.plan.length; i++) {
        if (state.plan[i].sectionName.includes(quarterName)) {
          startPlanIndex = i;
          break;
        }
      }

      if (startPlanIndex === -1) {
        console.error("Не удалось найти начальную четверть в плане.");
        return;
      }

      const dayMap: { [key: number]: DayOfWeek } = {
        0: "воскресенье",
        1: "понедельник",
        2: "вторник",
        3: "среда",
        4: "четверг",
        5: "пятница",
        6: "суббота",
      };

      let currentDate = new Date(calendarProfile.quarters[startQuarter].start);
      let dayIndex = 0;

      for (let i = startPlanIndex; i < state.plan.length; i++) {
        const lesson = state.plan[i];

        if (lesson.rowType === LessonRowType.QUARTER_HEADER) {
          continue;
        }

        while (true) {
          const dayOfWeek = dayMap[currentDate.getDay()];
          const isSelectedDay = selectedDays.includes(dayOfWeek);

          if (isSelectedDay && !isHoliday(currentDate)) {
            lesson.date = currentDate.toISOString().split("T")[0];
            dayIndex++;
            if (dayIndex >= selectedDays.length) {
              dayIndex = 0;
              currentDate.setDate(currentDate.getDate() + 1);
            }
            break;
          } else {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(initKtpPlan.pending, (state) => {
        state.status = "loading";
      })
      .addCase(initKtpPlan.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.plan = action.payload.plan;
        state.sourceTupName = action.payload.name;
      })
      .addCase(initKtpPlan.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const {
  updateLesson,
  addHour,
  deleteLesson,
  reorderPlan,
  addSor,
  autofillDates,
} = ktpEditorSlice.actions;

export const ktpEditorReducer = ktpEditorSlice.reducer;
