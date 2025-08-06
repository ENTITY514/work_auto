import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {
  AcademicPlan,
  KtpPlan,
  IKtpLesson,
  StoredTup,
} from "../types/academicPlan";

// Обновленная функция-трансформер
const transformTupToKtp = (tup: AcademicPlan): KtpPlan => {
  const ktpPlan: KtpPlan = [];
  let lessonCounter = 1;
  let hoursInSectionCounter = 1;

  tup.forEach((quarter, quarterIndex) => {
    ktpPlan.push({
      id: `header-${quarter.name}`,
      rowType: "quarter-header",
      lessonNumber: 0,
      hoursInSection: 0,
      sectionName: quarter.name,
      lessonTopic: "",
      objectiveId: "",
      objectiveDescription: "",
      hours: 0,
      date: "",
      notes: "",
    });

    if (quarterIndex === 0 && quarter.repetitionInfo.length > 0) {
      quarter.repetitionInfo.forEach((repTopic, index) => {
        ktpPlan.push({
          id: `rep-start-${quarter.name}-${index}`,
          rowType: "repetition",
          lessonNumber: lessonCounter++,
          hoursInSection: 1,
          sectionName: "Повторение",
          lessonTopic: repTopic,
          objectiveId: "",
          objectiveDescription: "",
          hours: 1,
          date: "",
          notes: "",
        });
      });
    }

    quarter.sections.forEach((section) => {
      hoursInSectionCounter = 1;
      section.topics.forEach((topic) => {
        topic.objectives.forEach((objective) => {
          ktpPlan.push({
            id: objective.id,
            lessonNumber: lessonCounter++,
            hoursInSection: hoursInSectionCounter++,
            sectionName: section.name,
            lessonTopic: topic.name,
            objectiveId: objective.id,
            objectiveDescription: objective.description,
            hours: 1,
            date: "",
            notes: "",
            rowType: "standard",
          });
        });
      });
    });

    ktpPlan.push({
      id: `soch-${quarter.name}`,
      rowType: "soch",
      lessonNumber: lessonCounter++,
      hoursInSection: 1,
      sectionName: "",
      lessonTopic: `Суммативное оценивание за ${quarter.name}`,
      objectiveId: "",
      objectiveDescription: "",
      hours: 1,
      date: "",
      notes: "",
    });

    // ✅ ИСПРАВЛЕНИЕ 1: Обновленная логика для конечных повторений
    const endRepetitionTopics: string[] = [];
    if (quarterIndex === 3) {
      // Логика для 4-й четверти
      if (quarter.repetitionInfo.length > 0) {
        endRepetitionTopics.push(...quarter.repetitionInfo);
      }
      while (endRepetitionTopics.length < 2) {
        endRepetitionTopics.push("Повторение");
      }
    } else {
      // Логика для 1, 2, 3-й четвертей
      endRepetitionTopics.push("Повторение", "Повторение");
      if (quarterIndex > 0 && quarter.repetitionInfo.length > 0) {
        endRepetitionTopics.push(...quarter.repetitionInfo);
      }
    }

    endRepetitionTopics.forEach((repTopic, index) => {
      ktpPlan.push({
        id: `rep-end-${quarter.name}-${index}`,
        rowType: "repetition",
        lessonNumber: lessonCounter++,
        hoursInSection: 1,
        sectionName: "",
        lessonTopic: repTopic,
        objectiveId: "",
        objectiveDescription: "",
        hours: 1,
        date: "",
        notes: "",
      });
    });
  });

  return ktpPlan;
};

const KtpEditorPage: React.FC = () => {
  const { tupId } = useParams<{ tupId: string }>();
  const [ktpPlan, setKtpPlan] = useState<KtpPlan>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [tupName, setTupName] = useState<string>("");
  const [sorCounter, setSorCounter] = useState(1); // Cчётчик для СОР

  useEffect(() => {
    /* ... код без изменений ... */
  }, [tupId]);
  const handleInputChange = (/* ... код без изменений ... */) => {};

  // ✅ ИСПРАВЛЕНИЕ 3: Новая функция для добавления СОР
  const handleAddSor = (sectionName: string) => {
    let newPlan = [...ktpPlan];
    const lastLessonIndex = newPlan.findLastIndex(
      (l) => l.sectionName === sectionName
    );

    if (lastLessonIndex === -1) return;

    const lastLessonOfSection = newPlan[lastLessonIndex];

    const sorLesson: IKtpLesson = {
      id: `sor-${sectionName}-${sorCounter}`,
      rowType: "sor",
      lessonNumber: 0, // Номер будет пересчитан
      hoursInSection: 0, // Номер будет пересчитан
      sectionName: sectionName,
      lessonTopic: `${lastLessonOfSection.lessonTopic} СОР№${sorCounter}`,
      objectiveId: "Цели на усмотрение учителя",
      objectiveDescription: "",
      hours: 1,
      date: "",
      notes: "",
    };

    const duplicateLesson: IKtpLesson = {
      ...lastLessonOfSection,
      id: `duplicate-${lastLessonOfSection.id}`,
      lessonNumber: 0,
      hoursInSection: 0,
    };

    // Вставляем два новых урока после последнего урока раздела
    newPlan.splice(lastLessonIndex + 1, 0, sorLesson, duplicateLesson);

    // Пересчитываем всю нумерацию
    let lessonCounter = 1;
    let hoursInSectionCounter = 1;
    let currentSection = "";
    newPlan = newPlan.map((lesson) => {
      if (lesson.rowType === "quarter-header") {
        currentSection = "";
        return lesson;
      }

      if (lesson.sectionName !== currentSection) {
        currentSection = lesson.sectionName;
        hoursInSectionCounter = 1;
      }

      if (lesson.rowType === "standard" || lesson.rowType === "sor") {
        lesson.hoursInSection = hoursInSectionCounter++;
      } else {
        lesson.hoursInSection = 1;
      }

      lesson.lessonNumber = lessonCounter++;
      return lesson;
    });

    setKtpPlan(newPlan);
    setSorCounter((prev) => prev + 1);
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="xl">
      {/* ... Заголовок и кнопка Сохранить ... */}

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>{/* ... Заголовки таблицы ... */}</TableHead>
          <TableBody>
            {ktpPlan.map((lesson, index) => {
              // ... логика isNewSection, showSectionText и т.д. остается без изменений ...

              if (
                lesson.rowType === "soch" ||
                lesson.rowType === "repetition"
              ) {
                return (
                  <TableRow key={lesson.id} sx={{ backgroundColor: "#fffde7" }}>
                    <TableCell>{lesson.lessonNumber}</TableCell>
                    <TableCell align="center">
                      {lesson.hoursInSection}
                    </TableCell>
                    {/* ✅ ИСПРАВЛЕНИЕ 2: Делаем тему повторения редактируемой */}
                    <TableCell colSpan={2}>
                      <TextField
                        variant="standard"
                        fullWidth
                        value={lesson.lessonTopic}
                        onChange={(e) =>
                          handleInputChange(
                            lesson.id,
                            "lessonTopic",
                            e.target.value
                          )
                        }
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell></TableCell>
                    {/* ... остальные ячейки ... */}
                  </TableRow>
                );
              }

              // ✅ Новый вид для строки СОР
              if (lesson.rowType === "sor") {
                return (
                  <TableRow key={lesson.id} sx={{ backgroundColor: "#ffebee" }}>
                    <TableCell>{lesson.lessonNumber}</TableCell>
                    <TableCell align="center">
                      {lesson.hoursInSection}
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: "top",
                        borderLeft: "3px solid #1976d2",
                      }}
                    ></TableCell>
                    <TableCell colSpan={2} sx={{ fontWeight: "bold" }}>
                      <TextField
                        variant="standard"
                        fullWidth
                        value={lesson.lessonTopic}
                        onChange={(e) =>
                          handleInputChange(
                            lesson.id,
                            "lessonTopic",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    {/* ... остальные ячейки ... */}
                  </TableRow>
                );
              }

              // Отображение стандартного урока
              return (
                <TableRow
                  key={lesson.id}
                  sx={{ backgroundColor: sectionBgColor }}
                >
                  {/* ... ячейки № и Часы в разделе ... */}
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      borderLeft: "3px solid #1976d2",
                      position: "relative",
                    }}
                  >
                    {showSectionText && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {lesson.sectionName}
                        {/* ✅ ИСПРАВЛЕНИЕ 3: Кнопка "Добавить СОР" */}
                        <Tooltip title="Добавить СОР для этого раздела">
                          <IconButton
                            size="small"
                            onClick={() => handleAddSor(lesson.sectionName)}
                          >
                            <AddCircleOutlineIcon
                              fontSize="small"
                              color="primary"
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                  {/* ... остальные ячейки ... */}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {/* ... кнопка Сохранить ... */}
    </Container>
  );
};

export default KtpEditorPage;
