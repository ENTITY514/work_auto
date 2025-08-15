// src/store/store.ts

import { configureStore } from "@reduxjs/toolkit";
import { academicPlanReducer } from "../entities/circulumPlan/model/slice";
import { ktpEditorReducer } from "../entities/ktp/model/slice";
import { calendarReducer } from "../entities/calendar/model/slice";

export const store = configureStore({
  reducer: {
    academicPlan: academicPlanReducer,
    ktpEditor: ktpEditorReducer,
    calendar: calendarReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
