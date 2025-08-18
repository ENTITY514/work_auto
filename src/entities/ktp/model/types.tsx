// src/entities/ktp/model/types.ts

export interface IKtpLesson {
  id: string;
  lessonNumber: number;
  hoursInSection: number;
  sectionName: string;
  lessonTopic: string;
  objectiveId: string;
  objectiveDescription: string;
  hours: number;
  date: string;
  notes: string;
  rowType: LessonRowType;
}

export enum LessonRowType {
  STANDARD = "standard",
  QUARTER_HEADER = "quarter-header",
  SOCH = "soch",
  REPETITION = "repetition",
  SOR = "sor",
}

export type KtpPlan = IKtpLesson[];

export type DayOfWeek =
  | "понедельник"
  | "вторник"
  | "среда"
  | "четверг"
  | "пятница"
  | "суббота"
  | "воскресенье";
