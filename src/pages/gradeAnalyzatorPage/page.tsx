import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
} from "@mui/material";
import * as XLSX from "xlsx";
import {
  IGradeJournal,
  IJournalHeader,
  IStudent,
  IAssessmentColumn,
  IGrade,
} from "../../interfaces/grade_journal.interface";
import FileUploaderUI from "../../modules/FileUploaderUI";
import JournalTable from "../../components/journalTable/journalTable";
import GradeAnalysisReport from "../../components/GradeAnalysisReport/GradeAnalysisReport";

// ✅ ОСНОВНАЯ ЛОГИКА ПАРСИНГА
const parseGradeJournal = (worksheet: XLSX.WorkSheet): IGradeJournal => {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

  const header: IJournalHeader = {
    className: (data[1]?.[0] || "").replace("Класс:", "").trim(),
    subject: (data[2]?.[0] || "").replace("Предмет:", "").trim(),
    teacherName: (data[4]?.[0] || "").replace("ФИО учителя:", "").trim(),
  };

  const students: IStudent[] = [];
  for (let i = 9; i < data.length; i++) {
    const studentId = parseInt(data[i][0], 10);
    const studentName = data[i][1];
    if (studentId && studentName) {
      students.push({ id: studentId, name: studentName });
    }
  }

  const assessments: IAssessmentColumn[] = [];
  let currentMonth = "";
  for (let j = 2; j < (data[6] || []).length; j++) {
    const monthCell = data[6][j];
    if (monthCell) currentMonth = monthCell.trim();

    const type7 = (data[6]?.[j] || "").trim();
    const maxScore9 = data[8]?.[j];
    const day8 = data[7]?.[j];

    let column: IAssessmentColumn | null = null;

    // Делаем проверку нечувствительной к регистру
    if (type7.toLowerCase().includes("сор")) {
      column = {
        id: `col-${j}`,
        colIndex: j,
        type: "SOR",
        title: type7,
        maxScore: parseInt(maxScore9, 10),
      };
    } else if (type7.toLowerCase().includes("соч")) {
      column = {
        id: `col-${j}`,
        colIndex: j,
        type: "SOCH",
        title: type7,
        maxScore: parseInt(maxScore9, 10),
      };
    } else if (type7.toLowerCase().includes("чтв")) {
      column = { id: `col-${j}`, colIndex: j, type: "Quarter", title: type7 };
    } else if (day8) {
      column = {
        id: `col-${j}`,
        colIndex: j,
        type: "FO",
        title: `${day8}/${currentMonth}`,
      };
    }

    if (column) assessments.push(column);
  }

  const grades: IGrade[] = [];
  students.forEach((student) => {
    assessments.forEach((assessment) => {
      const studentRowIndex = student.id + 8;
      const score = data[studentRowIndex]?.[assessment.colIndex];
      if (score !== undefined) {
        grades.push({
          studentId: student.id,
          assessmentId: assessment.id,
          score: score.toString(),
        });
      }
    });
  });

  return { header, students, assessments, grades };
};

const GradeAnalyzerPage: React.FC = () => {
  const [journalData, setJournalData] = useState<IGradeJournal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = parseGradeJournal(worksheet);
        setJournalData(parsedData);
        setError(null);
        setShowAnalysis(false); // Скрываем старый анализ при загрузке нового файла
      } catch (err) {
        console.error("Ошибка парсинга журнала:", err);
        setError(
          "Не удалось обработать файл. Убедитесь, что структура файла верна."
        );
        setJournalData(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Анализатор журнала оценок
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Загрузить журнал успеваемости (.xlsx)
        </Typography>
        <FileUploaderUI
          onFileSelect={handleFileSelect}
          selectedFile={null}
          isUploaded={!!journalData}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {journalData && (
        <Box>
          <JournalTable journalData={journalData} />

          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            {/* ✅ Кнопка теперь показывает/скрывает анализ */}
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              {showAnalysis ? "Скрыть анализ" : "Составить анализ оценок"}
            </Button>
          </Box>

          {/* ✅ Условный рендеринг компонента с отчетом */}
          {showAnalysis && <GradeAnalysisReport journalData={journalData} />}
        </Box>
      )}
    </Container>
  );
};

export default GradeAnalyzerPage;
