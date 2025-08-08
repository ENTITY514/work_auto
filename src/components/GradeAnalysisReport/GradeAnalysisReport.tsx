import React, { useMemo, useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Grid,
} from "@mui/material";
import { IGradeJournal } from "../../interfaces/grade_journal.interface";

interface GradeAnalysisReportProps {
  journalData: IGradeJournal;
}

// Интерфейс для хранения результатов анализа по одной работе
interface IAnalysisRow {
  title: string;
  maxScore?: number;
  studentCount: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
  qualityPercent: string;
  achievementPercent: string;
}

// Интерфейс для второй таблицы анализа целей
interface IObjectiveAnalysis {
  assessmentTitle: string;
  achieved: string;
  difficult: string;
}

const GradeAnalysisReport: React.FC<GradeAnalysisReportProps> = ({
  journalData,
}) => {
  // Состояние для редактируемых текстовых полей
  const [analysisText, setAnalysisText] = useState({
    difficultTasks: "",
    recommendations: "",
  });

  // Отдельное состояние для второй таблицы
  const [objectiveAnalysis, setObjectiveAnalysis] = useState<
    IObjectiveAnalysis[]
  >([]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAnalysisText((prev) => ({ ...prev, [name]: value }));
  };

  const handleObjectiveTextChange = (
    index: number,
    field: "achieved" | "difficult",
    value: string
  ) => {
    const updated = [...objectiveAnalysis];
    updated[index][field] = value;
    setObjectiveAnalysis(updated);
  };

  // Главный хук для всех вычислений.
  // useMemo кэширует результат, чтобы не пересчитывать его при каждом рендере.
  const { analysisData, studentPerformance } = useMemo(() => {
    const analysisResults: IAnalysisRow[] = [];
    const { assessments, grades, students } = journalData;

    // 1. Отбираем только СОР и СОЧ с максимальным баллом
    const summativeAssessments = assessments.filter(
      (a) =>
        (a.type === "SOR" || a.type === "SOCH") && a.maxScore && a.maxScore > 0
    );

    summativeAssessments.forEach((assessment) => {
      // 2. Находим все оценки за данную работу
      const relevantGrades = grades.filter(
        (g) =>
          g.assessmentId === assessment.id &&
          g.score &&
          !isNaN(parseFloat(g.score))
      );

      const studentCount = relevantGrades.length;
      if (studentCount === 0) return;

      let lowCount = 0,
        mediumCount = 0,
        highCount = 0;
      let achievementCount = 0,
        qualityCount = 0;

      // 3. Считаем проценты для каждого ученика
      relevantGrades.forEach((grade) => {
        const score = parseFloat(grade.score);
        const percent = Math.round((score / assessment.maxScore!) * 100);

        if (percent >= 85) highCount++;
        else if (percent >= 40) mediumCount++;
        else lowCount++;

        if (percent >= 65) qualityCount++;
        if (percent >= 40) achievementCount++;
      });

      // 4. Считаем итоговые проценты качества и успеваемости
      const qualityPercent =
        ((qualityCount / studentCount) * 100).toFixed(0) + "%";
      const achievementPercent =
        ((achievementCount / studentCount) * 100).toFixed(0) + "%";

      analysisResults.push({
        title: assessment.title,
        maxScore: assessment.maxScore,
        studentCount,
        lowCount,
        mediumCount,
        highCount,
        qualityPercent,
        achievementPercent,
      });
    });

    // 5. Логика для расчета успеваемости по ученикам
    const performance: { [key: string]: string[] } = {
      excellent: [],
      good: [],
      satisfactory: [],
    };
    const quarterAssessment = journalData.assessments.find(
      (a) => a.type === "Quarter"
    );
    if (quarterAssessment) {
      journalData.students.forEach((student) => {
        const gradeRecord = journalData.grades.find(
          (g) =>
            g.studentId === student.id &&
            g.assessmentId === quarterAssessment.id
        );
        const grade = parseInt(gradeRecord?.score || "0", 10);
        if (grade === 5) performance.excellent.push(student.name);
        else if (grade === 4) performance.good.push(student.name);
        else if (grade === 3) performance.satisfactory.push(student.name);
      });
    }

    return { analysisData: analysisResults, studentPerformance: performance };
  }, [journalData]);

  // Инициализируем состояние для второй таблицы при первой загрузке
  useEffect(() => {
    setObjectiveAnalysis(
      analysisData.map((a) => ({
        assessmentTitle: a.title,
        achieved: "",
        difficult: "",
      }))
    );
  }, [analysisData]);

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Анализ результатов СОР и СОЧ
      </Typography>
      <Typography align="center" color="text.secondary">
        {journalData.header.subject}, {journalData.header.className},{" "}
        {journalData.header.teacherName}
      </Typography>

      {/* Таблица с результатами */}
      <TableContainer component={Paper} sx={{ my: 3 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell rowSpan={2} sx={{ fontWeight: "bold" }}>
                СОР/СОЧ
              </TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: "bold" }}>
                Макс. балл
              </TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: "bold" }}>
                Кол-во уч-ся
              </TableCell>
              <TableCell colSpan={3} align="center" sx={{ fontWeight: "bold" }}>
                Процентное содержание баллов
              </TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: "bold" }}>
                % кач-ва
              </TableCell>
              <TableCell rowSpan={2} sx={{ fontWeight: "bold" }}>
                % успев-ти
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Низкий (0-39%)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Средний (40-84%)
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Высокий (85-100%)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {analysisData.map((row) => (
              <TableRow key={row.title}>
                <TableCell>{row.title}</TableCell>
                <TableCell align="center">{row.maxScore}</TableCell>
                <TableCell align="center">{row.studentCount}</TableCell>
                <TableCell align="center">{row.lowCount}</TableCell>
                <TableCell align="center">{row.mediumCount}</TableCell>
                <TableCell align="center">{row.highCount}</TableCell>
                <TableCell align="center">{row.qualityPercent}</TableCell>
                <TableCell align="center">{row.achievementPercent}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Новая таблица для анализа целей */}
      <Typography variant="h6" sx={{ mt: 4 }}>
        Анализ по цели обучения
      </Typography>
      <TableContainer component={Paper} sx={{ my: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                СОР/СОЧ
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Достигнутые цели
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Цели, вызвавшие затруднения
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {objectiveAnalysis.map((row, index) => (
              <TableRow key={row.assessmentTitle}>
                <TableCell>{row.assessmentTitle}</TableCell>
                <TableCell>
                  <TextField
                    multiline
                    fullWidth
                    variant="standard"
                    value={row.achieved}
                    onChange={(e) =>
                      handleObjectiveTextChange(
                        index,
                        "achieved",
                        e.target.value
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    multiline
                    fullWidth
                    variant="standard"
                    value={row.difficult}
                    onChange={(e) =>
                      handleObjectiveTextChange(
                        index,
                        "difficult",
                        e.target.value
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Новый блок для вывода успеваемости */}
      <Box sx={{ mt: 4 }}>
        <Typography>
          <b>На «отлично» ({studentPerformance.excellent.length} учеников):</b>{" "}
          {studentPerformance.excellent.join(", ") || "нет"}
        </Typography>
        <Typography>
          <b>На «хорошо» ({studentPerformance.good.length} учеников):</b>{" "}
          {studentPerformance.good.join(", ") || "нет"}
        </Typography>
        <Typography>
          <b>
            На «удовлетворительно» ({studentPerformance.satisfactory.length}{" "}
            учеников):
          </b>{" "}
          {studentPerformance.satisfactory.join(", ") || "нет"}
        </Typography>
      </Box>

      {/* Поля для заданий и рекомендаций */}
      <Box display="flex" flexWrap="wrap" mx={-1} mt={2}>
        <Box width={{ xs: "100%", md: "50%" }} px={1}>
          <TextField
            label="Задания, с которыми возникли трудности"
            name="difficultTasks"
            value={analysisText.difficultTasks}
            onChange={handleTextChange}
            multiline
            rows={4}
            fullWidth
            margin="normal"
          />
        </Box>
        <Box width={{ xs: "100%", md: "50%" }} px={1}>
          <TextField
            label="Выводы и рекомендации"
            name="recommendations"
            value={analysisText.recommendations}
            onChange={handleTextChange}
            multiline
            rows={4}
            fullWidth
            margin="normal"
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default GradeAnalysisReport;
