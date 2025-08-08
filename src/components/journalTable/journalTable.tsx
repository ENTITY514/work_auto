import React from "react";
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
} from "@mui/material";
import { IGradeJournal } from "../../interfaces/grade_journal.interface";

interface JournalTableProps {
  journalData: IGradeJournal;
}

const JournalTable: React.FC<JournalTableProps> = ({ journalData }) => {
  const { header, students, assessments, grades } = journalData;

  // Стили для ячеек, чтобы сделать таблицу более читаемой
  const headCellSx = {
    fontWeight: "bold",
    textAlign: "center",
    border: "1px solid #ddd",
    padding: "4px",
    fontSize: "0.75rem",
  };

  const bodyCellSx = {
    border: "1px solid #ddd",
    padding: "6px",
    textAlign: "center",
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      {/* Отображаем информацию из шапки журнала */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">{header.subject}</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {header.className}, {header.teacherName}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead>
            {/* Первая строка заголовка (№, ФИО, Названия колонок) */}
            <TableRow>
              <TableCell sx={headCellSx} rowSpan={2}>
                №
              </TableCell>
              <TableCell
                sx={headCellSx}
                rowSpan={2}
                style={{ minWidth: 150, textAlign: "left" }}
              >
                Фамилия, имя ученика
              </TableCell>
              {assessments.map((col) => (
                <TableCell key={col.id} sx={headCellSx}>
                  {col.title}
                </TableCell>
              ))}
            </TableRow>

            {/* Вторая строка заголовка (пустые, типы работ, макс. баллы) */}
            <TableRow>
              {assessments.map((col) => (
                <TableCell
                  key={`${col.id}-details`}
                  sx={{ ...headCellSx, backgroundColor: "#f5f5f5" }}
                >
                  {col.type === "FO" && "ФО"}
                  {(col.type === "SOR" || col.type === "SOCH") &&
                    `Макс: ${col.maxScore}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell sx={bodyCellSx}>{student.id}</TableCell>
                <TableCell sx={{ ...bodyCellSx, textAlign: "left" }}>
                  {student.name}
                </TableCell>

                {/* Итерируем по колонкам, чтобы найти нужную оценку для каждого ученика */}
                {assessments.map((assessment) => {
                  const grade = grades.find(
                    (g) =>
                      g.studentId === student.id &&
                      g.assessmentId === assessment.id
                  );
                  return (
                    <TableCell key={assessment.id} sx={bodyCellSx}>
                      {grade?.score || ""}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default JournalTable;
