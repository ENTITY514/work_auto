
import * as XLSX from 'xlsx';
import { IKtpLesson, LessonRowType } from '../../entities/ktp/model/types';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
};

export const generateXlsx = (ktp: IKtpLesson[], fileName: string) => {
  const header = ['Дата', 'Тема урока', 'Домашнее задание к следующему уроку'];
  const data = [header];
  let currentQuarter = '';

  let i = 0;
  while (i < ktp.length) {
    const lesson = ktp[i];

    if (lesson.rowType === LessonRowType.QUARTER_HEADER) {
      const match = lesson.sectionName.match(/(\d+)/);
      if (match) {
        currentQuarter = match[1];
      }
      i++;
      continue;
    }

    if (lesson.rowType === LessonRowType.SOCH) {
      const topic = `Суммативное оценивание за ${currentQuarter} четверть`;
      data.push([formatDate(lesson.date), topic, '']);
      i++;
      continue;
    }

    // Check for merged lessons
    if (lesson.date && i + 1 < ktp.length && ktp[i+1].date === lesson.date) {
      const nextLesson = ktp[i+1];
      const reason = lesson.notes || nextLesson.notes || '';
      const mergedTheme = `${lesson.lessonTopic} / ${nextLesson.lessonTopic} ${reason ? `(${reason})` : ''}`;
      data.push([formatDate(lesson.date), mergedTheme, '']);
      i += 2; // Skip next lesson
    } else {
      const lessonHours = lesson.hours || 1;
      for (let j = 0; j < lessonHours; j++) {
        data.push([formatDate(lesson.date), lesson.lessonTopic, '']);
      }
      i++;
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'КТП');

  // Auto-fit columns
  const cols = Object.keys(data[0]);
  const colWidths = cols.map((col, index) => {
      return { wch: Math.max(...data.map(row => row[index] ? row[index].toString().length : 0)) };
  });
  worksheet['!cols'] = colWidths;


  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
