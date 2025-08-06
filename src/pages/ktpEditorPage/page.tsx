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
import {
  AcademicPlan,
  KtpPlan,
  StoredTup,
  IKtpLesson,
} from "../../interfaces/academic_plan.interface";

// Функция transformTupToKtp остается без изменений
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

    const endRepetitionTopics: string[] = [];
    if (quarterIndex === 3) {
      if (quarter.repetitionInfo.length > 0) {
        endRepetitionTopics.push(...quarter.repetitionInfo);
      }
      while (endRepetitionTopics.length < 2) {
        endRepetitionTopics.push("Повторение");
      }
    } else {
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
  const [sorCounter, setSorCounter] = useState(1);

  let sectionGroupIndex = 0;

  useEffect(() => {
    // ... useEffect remains the same
    try {
      const savedData = localStorage.getItem("academicPlanData");
      if (savedData && tupId) {
        const allTups = JSON.parse(savedData) as StoredTup[];
        const tupIndex = parseInt(tupId, 10);
        if (allTups[tupIndex]) {
          setTupName(allTups[tupIndex].name);
          const transformedPlan = transformTupToKtp(allTups[tupIndex].planData);
          setKtpPlan(transformedPlan);
        } else {
          setError("Исходный ТУП не найден.");
        }
      }
    } catch (e) {
      setError("Не удалось загрузить или преобразовать ТУП.");
    } finally {
      setIsLoading(false);
    }
  }, [tupId]);

  const handleInputChange = (
    // ... handleInputChange remains the same
    lessonId: string,
    field: keyof IKtpLesson,
    value: string | number
  ) => {
    setKtpPlan((prevPlan) =>
      prevPlan.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
      )
    );
  };

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
      lessonNumber: 0,
      hoursInSection: 0,
      sectionName: sectionName,
      // ✅ ИЗМЕНЕНИЕ 4: Новый формат названия СОР
      lessonTopic: `${lastLessonOfSection.lessonTopic} СОР№${sorCounter} "${sectionName}"`,
      // ✅ ИЗМЕНЕНИЕ 2: Копируем цель из последнего урока
      objectiveId: lastLessonOfSection.objectiveId,
      objectiveDescription: lastLessonOfSection.objectiveDescription,
      hours: 1,
      date: "",
      notes: "",
    };

    const duplicateLesson: IKtpLesson = {
      ...lastLessonOfSection,
      id: `duplicate-${lastLessonOfSection.id}-${sorCounter}`,
      lessonNumber: 0,
      hoursInSection: 0,
    };

    newPlan.splice(lastLessonIndex + 1, 0, sorLesson, duplicateLesson);

    // Пересчитываем всю нумерацию
    let lessonCounter = 1;
    let hoursInSectionCounter = 1;
    let currentSectionName = "";

    newPlan = newPlan.map((lesson) => {
      if (lesson.rowType === "quarter-header") {
        currentSectionName = "";
        return lesson;
      }

      if (lesson.sectionName && lesson.sectionName !== currentSectionName) {
        currentSectionName = lesson.sectionName;
        hoursInSectionCounter = 1;
      }

      if (lesson.rowType === "standard" || lesson.rowType === "sor") {
        lesson.hoursInSection = hoursInSectionCounter++;
        //@ts-ignore
      } else if (lesson.rowType !== "quarter-header") {
        lesson.hoursInSection = 1;
      }
      //@ts-ignore
      if (lesson.rowType !== "quarter-header") {
        lesson.lessonNumber = lessonCounter++;
      }

      return lesson;
    });

    setKtpPlan(newPlan);
    setSorCounter((prev) => prev + 1);
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Редактор КТП на основе: "{tupName}"
      </Typography>

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", width: "3%" }}>№</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "5%" }}>
                Часы в разделе
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                Раздел/подраздел
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                Тема урока
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Цели обучения</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "5%" }}>
                Кол-во часов
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "10%" }}>
                Дата
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "12%" }}>
                Примечание
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ktpPlan.map((lesson, index) => {
              const prevLesson = ktpPlan[index - 1];
              let isNewSection = false;
              if (lesson.rowType === "standard") {
                if (
                  !prevLesson ||
                  lesson.sectionName !== prevLesson.sectionName
                ) {
                  isNewSection = true;
                }
              }

              let isNewTopic = false;
              if (lesson.rowType === "standard") {
                if (isNewSection) {
                  isNewTopic = true;
                } else if (
                  prevLesson &&
                  lesson.lessonTopic !== prevLesson.lessonTopic
                ) {
                  isNewTopic = true;
                }
              }

              if (isNewSection) {
                sectionGroupIndex++;
              }

              const sectionBgColor =
                sectionGroupIndex % 2 === 0 ? "#fafafa" : "transparent";
              const showSectionText = isNewSection;
              const showTopicText = isNewTopic;

              // ✅ ИЗМЕНЕНИЕ 3: Определяем, является ли текущая строка последней в своем разделе
              const isLastLessonInSection =
                lesson.rowType === "standard" &&
                (index === ktpPlan.length - 1 ||
                  ktpPlan[index + 1].sectionName !== lesson.sectionName);

              if (lesson.rowType === "quarter-header") {
                sectionGroupIndex = 0;
                return (
                  <TableRow key={lesson.id}>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ backgroundColor: "#e3f2fd", fontWeight: "bold" }}
                    >
                      {lesson.sectionName.toUpperCase()}
                    </TableCell>
                  </TableRow>
                );
              }

              if (lesson.rowType === "repetition") {
                return (
                  <TableRow key={lesson.id} sx={{ backgroundColor: "#fffde7" }}>
                    <TableCell>{lesson.lessonNumber}</TableCell>
                    <TableCell align="center">
                      {lesson.hoursInSection}
                    </TableCell>
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
                    <TableCell align="center">{lesson.hours}</TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        fullWidth
                        type="date"
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField variant="standard" fullWidth />
                    </TableCell>
                  </TableRow>
                );
              }

              // ✅ ИЗМЕНЕНИЕ 1: Новый стиль для строки СОР - бледно-синий
              if (lesson.rowType === "sor") {
                return (
                  <TableRow key={lesson.id} sx={{ backgroundColor: "#e3f2fd" }}>
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
                    <TableCell>
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
                    {/* Отображаем цель, скопированную из последнего урока */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {lesson.objectiveId}
                      </Typography>
                      {lesson.objectiveDescription}
                    </TableCell>
                    <TableCell align="center">{lesson.hours}</TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        fullWidth
                        type="date"
                        value={lesson.date}
                        onChange={(e) =>
                          handleInputChange(lesson.id, "date", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        fullWidth
                        value={lesson.notes}
                        onChange={(e) =>
                          handleInputChange(lesson.id, "notes", e.target.value)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              }

              // Обернем стандартную строку и кнопку в React.Fragment
              return (
                <React.Fragment key={lesson.id}>
                  <TableRow sx={{ backgroundColor: sectionBgColor }}>
                    <TableCell>{lesson.lessonNumber}</TableCell>
                    <TableCell align="center">
                      {lesson.hoursInSection}
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: "top",
                        borderLeft: "3px solid #1976d2",
                      }}
                    >
                      {showSectionText && lesson.sectionName}
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: "top",
                        borderLeft: lesson.lessonTopic
                          ? "2px solid #81d4fa"
                          : "none",
                      }}
                    >
                      {showTopicText && lesson.lessonTopic}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {lesson.objectiveId}
                      </Typography>
                      {lesson.objectiveDescription}
                    </TableCell>
                    <TableCell align="center">{lesson.hours}</TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        fullWidth
                        type="date"
                        value={lesson.date}
                        onChange={(e) =>
                          handleInputChange(lesson.id, "date", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        fullWidth
                        value={lesson.notes}
                        onChange={(e) =>
                          handleInputChange(lesson.id, "notes", e.target.value)
                        }
                      />
                    </TableCell>
                  </TableRow>

                  {/* ✅ ИЗМЕНЕНИЕ 3: Новая строка с кнопкой, которая появляется в конце раздела */}
                  {isLastLessonInSection && (
                    <TableRow sx={{ backgroundColor: sectionBgColor }}>
                      <TableCell colSpan={8} align="center" sx={{ py: 0 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleAddSor(lesson.sectionName)}
                          sx={{ my: 1 }}
                        >
                          Добавить СОР
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => console.log(ktpPlan)}
        >
          Сохранить КТП
        </Button>
      </Box>
    </Container>
  );
};

export default KtpEditorPage;
