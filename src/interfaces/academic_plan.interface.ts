export interface LearningObjective {
  id: string;          // Номер цели, например "7.1.2.1"
  description: string; // Текст цели
}

export interface LearningTopic {
  name: string;
  objectives: LearningObjective[];
}

export interface LearningSection {
  name: string; // Название раздела, например "Степень с натуральным и целым показателями"
  topics: LearningTopic[];
}

export interface Quarter {
  name: string;
  repetitionInfo: string[]; // Для строк "Повторение..."
  sections: LearningSection[];
}

export type AcademicPlan = Quarter[];

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
  // ✅ Добавляем тип 'sor'
  rowType: 'standard' | 'quarter-header' | 'soch' | 'repetition' | 'sor'; 
}

export type KtpPlan = IKtpLesson[];

export interface StoredTup {
  id: string; // Уникальный ID для каждого ТУП
  name: string; // Редактируемое имя
  planData: AcademicPlan; // Сам учебный план
}