import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";
import { transformTupToKtp, renumberPlan } from "./lib";
import { KtpPlan, IKtpLesson, LessonRowType } from "./types";
import { arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";

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

      // Правильный расчет порядкового номера СОР за весь период
      const totalSorCount = state.plan.filter(
        (l) => l.rowType === LessonRowType.SOR
      ).length;

      const newSor: IKtpLesson = {
        ...sectionLastLesson,
        id: uuidv4(),
        lessonTopic: `СОР №${totalSorCount + 1} по разделу "${
          sectionLastLesson.sectionName
        }"`,
        // Наследование целей обучения
        objectiveId: sectionLastLesson.objectiveId,
        objectiveDescription: sectionLastLesson.objectiveDescription,
        hours: 1,
        date: "",
        notes: "", // Пустое примечание
        rowType: LessonRowType.SOR,
      };

      const newHour: IKtpLesson = { ...sectionLastLesson, id: uuidv4() };

      const newIndex = lastLessonIndex + 1;
      state.plan.splice(newIndex, 0, newSor, newHour);
      state.plan = renumberPlan(state.plan);
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

export const { updateLesson, addHour, deleteLesson, reorderPlan, addSor } =
  ktpEditorSlice.actions;

export const ktpEditorReducer = ktpEditorSlice.reducer;
