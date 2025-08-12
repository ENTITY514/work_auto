// src/store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import { academicPlanReducer } from '../entities/circulumPlan/model/slice';
import { ktpEditorReducer } from '../entities/ktp/model/slice';

export const store = configureStore({
  reducer: {
    academicPlan: academicPlanReducer,
    ktpEditor: ktpEditorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;