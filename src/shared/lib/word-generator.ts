import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, PageOrientation, AlignmentType } from 'docx';
import { IKtpLesson, KtpPlan, ILessonObjective, LessonRowType } from '../../entities/ktp/model/types';

export const generateWordDocument = (ktpData: {
  subjectName: string;
  className: string;
  hoursPerWeek: number;
  totalHours: number;
  plan: KtpPlan;
  quarterWorkHours: { q1: number; q2: number; q3: number; q4: number; };
}) => {
  const { subjectName, className, hoursPerWeek, totalHours, plan, quarterWorkHours } = ktpData;

  const columnWidths = [5, 5, 15, 15, 25, 5, 10, 10, 10];

  const tableHeader = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('№')] }),
      new TableCell({ children: [new Paragraph('№ урока')] }),
      new TableCell({ children: [new Paragraph('Разделы долгосрочного плана')] }),
      new TableCell({ children: [new Paragraph('Темы/Содержание раздела долгосрочного плана')] }),
      new TableCell({ children: [new Paragraph('Цели обучения')] }),
      new TableCell({ children: [new Paragraph('Кол-во часов')] }),
      new TableCell({ children: [new Paragraph('Дата (запланированное)')] }),
      new TableCell({ children: [new Paragraph('Дата (фактическое)')] }),
      new TableCell({ children: [new Paragraph('Примечание')] }),
    ],
  });

  let lessonCounter = 0;
  const tableRows = plan.map((lesson: IKtpLesson, index: number) => {
    if (lesson.rowType === LessonRowType.QUARTER_HEADER) {
      const quarterNumber = lesson.sectionName.match(/\d+/)?.[0];
      const quarterKey = quarterNumber ? `q${quarterNumber}` as keyof typeof quarterWorkHours : null;
      const hours = quarterKey ? quarterWorkHours[quarterKey] : '';

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: lesson.sectionName, bold: true, italics: true })], alignment: AlignmentType.CENTER })],
            columnSpan: 6,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `Количество часов: ${hours}`, bold: true, italics: true })], alignment: AlignmentType.CENTER })],
            columnSpan: 3,
          }),
        ],
      });
    }

    let sectionCell = new TableCell({ children: [new Paragraph(lesson.sectionName)] });
    if (index > 0 && lesson.sectionName === plan[index - 1].sectionName && lesson.lessonTopic !== 'Повторение') {
      sectionCell = new TableCell({ children: [] });
    }

    let topicCell = new TableCell({ children: [new Paragraph(lesson.lessonTopic)] });
    if (index > 0 && lesson.lessonTopic === plan[index - 1].lessonTopic && lesson.lessonTopic !== 'Повторение') {
      topicCell = new TableCell({ children: [] });
    }

    lessonCounter++;

    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(lessonCounter.toString())] }),
        new TableCell({ children: [new Paragraph(lesson.lessonNumber.toString())] }),
        sectionCell,
        topicCell,
        new TableCell({ children: [new Paragraph(lesson.objectives.map((o: ILessonObjective) => `${o.id} ${o.description}`).join('\n'))] }),
        new TableCell({ children: [new Paragraph(lesson.hours.toString())] }),
        new TableCell({ children: [new Paragraph(lesson.date)] }),
        new TableCell({ children: [new Paragraph('')] }),
        new TableCell({ children: [new Paragraph(lesson.notes)] }),
      ],
    });
  });

  const table = new Table({
    rows: [tableHeader, ...tableRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: columnWidths,
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Календарно-тематическое планирование по предмету «${subjectName}»`,
                bold: true,
              }),
            ],
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(`класс - ${className}`)], borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } } }),
                  new TableCell({ children: [new Paragraph(`количество часов в неделю - ${hoursPerWeek} часа в неделю`)], borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } } }),
                  new TableCell({ children: [new Paragraph(`количество часов в учебном году - ${totalHours} часа в учебном году`)], borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } } }),
                ],
              }),
            ],
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
          table,
        ],
      },
    ],
  });

  Packer.toBlob(doc).then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ktp.docx';
    a.click();
    window.URL.revokeObjectURL(url);
  });
};