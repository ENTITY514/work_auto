
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { KtpPlan } from '../../entities/ktp/model/types';

// This is a simplified structure based on your component's state
interface AnalysisData {
  title: string;
  quarter: string;
  subject: string;
  class: string;
  studentsCount: string;
  teacher: string;
  goal: string;
  resultsTable: string[][];
  goalsTable: string[][];
  analysis: string;
  date: string;
  pedagog: string;
}

interface QuarterWorkHours {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
}

interface KtpData {
    subjectName: string;
    className: string;
    hoursPerWeek: number;
    totalHours: number;
    plan: KtpPlan;
    quarterWorkHours: QuarterWorkHours;
}

export const generateWordDocument = (data: KtpData) => {
    const { subjectName, className, hoursPerWeek, totalHours, plan } = data;

    const table = new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph('№')] }),
                    new TableCell({ children: [new Paragraph('Тема урока')] }),
                    new TableCell({ children: [new Paragraph('Кол-во часов')] }),
                    new TableCell({ children: [new Paragraph('Дата')] }),
                ],
            }),
            ...plan.map((item, index) => 
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(String(index + 1))] }),
                        new TableCell({ children: [new Paragraph(item.lessonTopic)] }),
                        new TableCell({ children: [new Paragraph(String(item.hours))] }),
                        new TableCell({ children: [new Paragraph(item.date || '')] }),
                    ],
                })
            )
        ],
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: `Календарно-тематическое планирование`, heading: 'Heading1' }),
                new Paragraph({ text: `Предмет: ${subjectName}` }),
                new Paragraph({ text: `Класс: ${className}` }),
                new Paragraph({ text: `Часов в неделю: ${hoursPerWeek}` }),
                new Paragraph({ text: `Всего часов: ${totalHours}` }),
                new Paragraph(''),
                table,
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `KTP_${subjectName}_${className}.docx`);
    });
}

export const generateSorSochAnalysisDocx = (analysisData: AnalysisData) => {
  const {
    title, quarter, subject, class: className, studentsCount, teacher, goal,
    resultsTable, goalsTable, analysis, date, pedagog
  } = analysisData;

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: 'Heading1', style: 'Title' }),
        new Paragraph({ text: quarter }),
        new Paragraph({ text: subject }),
        new Paragraph({ text: className }),
        new Paragraph({ text: studentsCount }),
        new Paragraph({ text: teacher }),
        new Paragraph({ text: goal }),
        new Paragraph({ text: '' }), // Spacer

        new Paragraph({ text: 'Результаты', heading: 'Heading2' }),
        new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('Предмет')] }),
                        new TableCell({ children: [new Paragraph('Писал')] }),
                        new TableCell({ children: [new Paragraph('Макс. балл')] }),
                        new TableCell({ children: [new Paragraph('Низкий (0-39%)')] }),
                        new TableCell({ children: [new Paragraph('Средний (40-84%)')] }),
                        new TableCell({ children: [new Paragraph('Высокий (85-100%)')] }),
                        new TableCell({ children: [new Paragraph('% качества')] }),
                        new TableCell({ children: [new Paragraph('% успеваемости')] }),
                    ],
                }),
                ...resultsTable.map(row => new TableRow({
                    children: row.map(cell => new TableCell({ children: [new Paragraph(cell)] }))
                }))
            ],
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
        }),
        new Paragraph({ text: '' }), // Spacer

        new Paragraph({ text: 'Цели', heading: 'Heading2' }),
        new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('Достигнутые цели')] }),
                        new TableCell({ children: [new Paragraph('Цели, вызвавшие затруднения')] }),
                    ],
                }),
                ...goalsTable.map(row => new TableRow({
                    children: row.map(cell => new TableCell({ children: [new Paragraph(cell)] }))
                }))
            ],
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
        }),
        new Paragraph({ text: '' }), // Spacer

        new Paragraph({ text: 'Анализ и выводы', heading: 'Heading2' }),
        ...analysis.split('\n').map(p => new Paragraph(p)),

        new Paragraph({ text: '' }), // Spacer
        new Paragraph({ children: [new TextRun({ text: `Дата: ${date}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Педагог: ${pedagog}`}) ]}),
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, "sor_soch_analysis.docx");
  });
};
