import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
  PageOrientation,
  AlignmentType,
  VerticalMergeType,
} from "docx";
import {
  IKtpLesson,
  KtpPlan,
  ILessonObjective,
  LessonRowType,
} from "../../entities/ktp/model/types";

export const generateWordDocument = (ktpData: {
  subjectName: string;
  className: string;
  hoursPerWeek: number;
  totalHours: number;
  plan: KtpPlan;
  quarterWorkHours: { q1: number; q2: number; q3: number; q4: number };
}) => {
  const {
    subjectName,
    className,
    hoursPerWeek,
    totalHours,
    plan,
    quarterWorkHours,
  } = ktpData;

  // 3. Подсчет часов для каждого раздела
  const sectionHours = plan.reduce((acc, lesson) => {
    // Не считаем часы для заголовков четвертей
    if (lesson.rowType !== LessonRowType.QUARTER_HEADER) {
      acc[lesson.sectionName] = (acc[lesson.sectionName] || 0) + lesson.hours;
    }
    return acc;
  }, {} as Record<string, number>);

  const columnWidths = [5, 5, 15, 15, 25, 5, 10, 10, 10];

  const tableHeader = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph("№")] }),
      new TableCell({ children: [new Paragraph("№ урока")] }),
      new TableCell({
        children: [new Paragraph("Разделы долгосрочного плана")],
      }),
      new TableCell({
        children: [
          new Paragraph("Темы/Содержание раздела долгосрочного плана"),
        ],
      }),
      new TableCell({ children: [new Paragraph("Цели обучения")] }),
      new TableCell({ children: [new Paragraph("Кол-во часов")] }),
      new TableCell({ children: [new Paragraph("Дата (запланированное)")] }),
      new TableCell({ children: [new Paragraph("Дата (фактическое)")] }),
      new TableCell({ children: [new Paragraph("Примечание")] }),
    ],
  });

  let lessonCounter = 0;
  let lessonInSectionCounter = 0; // 1. Счетчик уроков в разделе
  let isAfterSoch = false; // Флаг для отслеживания уроков после СОЧ
  let currentQuarterNumber: string | undefined;
  const tableRows = plan.map((lesson: IKtpLesson, index: number) => {
    if (lesson.rowType === LessonRowType.QUARTER_HEADER) {
      lessonInSectionCounter = 0; // Сбрасываем счетчик для новой четверти
      isAfterSoch = false; // Сбрасываем флаг для новой четверти
      const quarterNumber = lesson.sectionName.match(/\d+/)?.[0];
      currentQuarterNumber = quarterNumber;
      const quarterKey = quarterNumber
        ? (`q${quarterNumber}` as keyof typeof quarterWorkHours)
        : null;
      const hours = quarterKey ? quarterWorkHours[quarterKey] : "";

      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: lesson.sectionName,
                    bold: true,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            columnSpan: 6,
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Количество часов: ${hours}`,
                    bold: true,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            columnSpan: 3,
          }),
        ],
      });
    }

    // 1. Логика нумерации уроков в разделе
    const prevLesson = index > 0 ? plan[index - 1] : null;
    const isNewSection =
      !prevLesson ||
      prevLesson.rowType === LessonRowType.QUARTER_HEADER ||
      (prevLesson && lesson.sectionName !== prevLesson.sectionName);

    if (isNewSection) {
      lessonInSectionCounter = 1;
    } else {
      lessonInSectionCounter++;
    }

    let displayLessonNumber = lessonInSectionCounter.toString();
    // Исключения для СОЧ и Повторения
    if (
      lesson.rowType === LessonRowType.SOCH ||
      lesson.rowType === LessonRowType.REPETITION
    ) {
      displayLessonNumber = "1";
    }

    const isSoch = lesson.rowType === LessonRowType.SOCH;
    if (isSoch) {
      isAfterSoch = true;
    }
    const isEndOfQuarterRepetition =
      lesson.rowType === LessonRowType.REPETITION && isAfterSoch;

    // 1) В строках с соч и повторением в конце четверти нужно обьеденить ячейки не только с темой и целью но и разделом.
    if (isSoch || isEndOfQuarterRepetition) {
      let mergedCellContent: string;
      if (isSoch) {
        mergedCellContent = currentQuarterNumber
          ? `Суммативное оценивание за ${currentQuarterNumber} четверть`
          : lesson.sectionName; // Fallback to the original name
      } else {
        mergedCellContent = lesson.lessonTopic;
      }
      const mergedCells = [
        new TableCell({
          children: [new Paragraph(mergedCellContent)],
          columnSpan: 3, // Раздел + Тема + Цели
        }),
      ];
      lessonCounter++;
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(lessonCounter.toString())],
          }),
          new TableCell({ children: [new Paragraph(displayLessonNumber)] }),
          ...mergedCells,
          new TableCell({ children: [new Paragraph(lesson.hours.toString())] }),
          new TableCell({ children: [new Paragraph(lesson.date)] }),
          new TableCell({ children: [new Paragraph("")] }),
          new TableCell({ children: [new Paragraph(lesson.notes)] }),
        ],
      });
    }

    // Стандартная логика для остальных уроков

    // Для соч и повторений не нужно указывать в скобках сколько часов в разделе.
    let sectionText = lesson.sectionName;
    if (
      lesson.rowType !== LessonRowType.SOCH &&
      lesson.rowType !== LessonRowType.REPETITION
    ) {
      sectionText = `${lesson.sectionName} (${
        sectionHours[lesson.sectionName]
      } часов)`;
    }

    // 2) Нужно обьеденить ячейки по столбцу.
    const shouldMergeSection =
      prevLesson !== null &&
      prevLesson.rowType !== LessonRowType.QUARTER_HEADER &&
      lesson.sectionName === prevLesson.sectionName &&
      lesson.rowType === LessonRowType.STANDARD &&
      prevLesson.rowType === LessonRowType.STANDARD;

    const sectionCell = new TableCell({
      children: shouldMergeSection ? [] : [new Paragraph(sectionText)],
      verticalMerge: shouldMergeSection
        ? VerticalMergeType.CONTINUE
        : VerticalMergeType.RESTART,
    });

    const shouldMergeTopic =
      prevLesson !== null &&
      prevLesson.rowType !== LessonRowType.QUARTER_HEADER &&
      lesson.lessonTopic === prevLesson.lessonTopic &&
      lesson.rowType === LessonRowType.STANDARD &&
      prevLesson.rowType === LessonRowType.STANDARD;

    const topicCell = new TableCell({
      children: shouldMergeTopic ? [] : [new Paragraph(lesson.lessonTopic)],
      verticalMerge: shouldMergeTopic
        ? VerticalMergeType.CONTINUE
        : VerticalMergeType.RESTART,
    });

    const objectivesCell = new TableCell({
      children: [
        new Paragraph({
          children: lesson.objectives
            .map((o: ILessonObjective) => `${o.id} ${o.description}`)
            .flatMap((text, i, arr) =>
              i === arr.length - 1
                ? [new TextRun(text)]
                : [new TextRun(text), new TextRun({ break: 1 })]
            ),
        }),
      ],
    });

    lessonCounter++;

    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(lessonCounter.toString())] }),
        new TableCell({ children: [new Paragraph(displayLessonNumber)] }),
        sectionCell, // Ячейка раздела с вертикальным объединением
        topicCell, // Ячейка темы с вертикальным объединением
        objectivesCell, // Ячейка целей (без объединения)
        new TableCell({ children: [new Paragraph(lesson.hours.toString())] }),
        new TableCell({ children: [new Paragraph(lesson.date)] }),
        new TableCell({ children: [new Paragraph("")] }),
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
            size: {
              width: 11906,
              height: 16838,
              orientation: PageOrientation.LANDSCAPE,
            },
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
            alignment: AlignmentType.CENTER,
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(`класс - ${className}`)],
                    borders: {
                      top: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      bottom: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      left: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      right: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `Количество часов в неделю - ${hoursPerWeek} часа в неделю`
                      ),
                    ],
                    borders: {
                      top: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      bottom: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      left: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      right: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `Количество часов в учебном году - ${totalHours} часа в учебном году`
                      ),
                    ],
                    borders: {
                      top: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      bottom: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      left: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                      right: {
                        style: BorderStyle.NONE,
                        size: 0,
                        color: "FFFFFF",
                      },
                    },
                  }),
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

  Packer.toBlob(doc).then((blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ktp.docx";
    a.click();
    window.URL.revokeObjectURL(url);
  });
};
