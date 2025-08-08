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
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTableRow } from "../../components/sortableTableRow/sortableTableRow";
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

// Функция renumberPlan остается без изменений
const renumberPlan = (plan: KtpPlan): KtpPlan => {
  let lessonCounter = 1;
  let hoursInSectionCounter = 1;
  let currentSectionName = "";

  return plan.map((lesson) => {
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

    return { ...lesson };
  });
};

const KtpEditorPage: React.FC = () => {
  const { tupId } = useParams<{ tupId: string }>();
  const [ktpPlan, setKtpPlan] = useState<KtpPlan>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [tupName, setTupName] = useState<string>("");
  const [sorCounter, setSorCounter] = useState(1);

  // ✅ ИЗМЕНЕНИЕ 2: Сделаем handleInputChange более универсальным, чтобы он принимал и числа.
  // Это нужно для полей, которые не являются текстовыми, но могут измениться.
  const handleInputChange = (
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

  // useEffect и другие хендлеры остаются без изменений
  useEffect(() => {
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
      lessonTopic: `${lastLessonOfSection.lessonTopic} СОР№${sorCounter}`,
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
    setKtpPlan(renumberPlan(newPlan));
    setSorCounter((prev) => prev + 1);
  };

  const handleAddHour = (lessonId: string) => {
    const lessonIndex = ktpPlan.findIndex((l) => l.id === lessonId);
    if (lessonIndex === -1) return;

    const originalLesson = ktpPlan[lessonIndex];
    const newHour: IKtpLesson = {
      ...originalLesson,
      id: `${originalLesson.id}-hour-${Date.now()}`,
      date: "",
      notes: "",
    };

    let newPlan = [...ktpPlan];
    newPlan.splice(lessonIndex + 1, 0, newHour);
    setKtpPlan(renumberPlan(newPlan));
  };

  const handleDeleteHour = (lessonId: string) => {
    const newPlan = ktpPlan.filter((l) => l.id !== lessonId);
    setKtpPlan(renumberPlan(newPlan));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setKtpPlan((plan) => {
        const oldIndex = plan.findIndex((item) => item.id === active.id);
        const newIndex = plan.findIndex((item) => item.id === over.id);
        const newPlan = arrayMove(plan, oldIndex, newIndex);
        return renumberPlan(newPlan);
      });
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Редактор КТП на основе: "{tupName}"
      </Typography>

      <TableContainer component={Paper}>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ktpPlan.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", width: "3%" }}>
                    №
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "5%" }}>
                    Часы в разделе
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                    Раздел/подраздел
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "15%" }}>
                    Тема урока
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Цели обучения
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "5%" }}>
                    Кол-во часов
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "10%" }}>
                    Дата
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "12%" }}>
                    Примечание
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "8%" }}>
                    Действия
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ktpPlan.map((lesson, index) => {
                  const prevLesson = ktpPlan[index - 1];
                  let isNewSection = false,
                    isNewTopic = false,
                    isNewObjective = false;

                  if (
                    lesson.rowType === "standard" ||
                    lesson.rowType === "sor"
                  ) {
                    if (
                      !prevLesson ||
                      lesson.sectionName !== prevLesson.sectionName
                    ) {
                      isNewSection = true;
                    }
                    if (
                      isNewSection ||
                      !prevLesson ||
                      lesson.lessonTopic !== prevLesson.lessonTopic
                    ) {
                      isNewTopic = true;
                    }
                    if (
                      isNewTopic ||
                      !prevLesson ||
                      lesson.objectiveId !== prevLesson.objectiveId
                    ) {
                      isNewObjective = true;
                    }
                  }

                  // Логика для отображения кнопки "Добавить СОР"
                  const isLastLessonInSection =
                    lesson.rowType === "standard" &&
                    (!ktpPlan[index + 1] ||
                      ktpPlan[index + 1].sectionName !== lesson.sectionName);

                  const objectiveHourCount = ktpPlan.filter(
                    (l) => l.objectiveId === lesson.objectiveId && l.objectiveId
                  ).length;

                  // Заголовок четверти
                  if (lesson.rowType === "quarter-header") {
                    return (
                      <TableRow key={lesson.id}>
                        <TableCell
                          colSpan={9}
                          align="center"
                          sx={{
                            backgroundColor: "#e3f2fd",
                            fontWeight: "bold",
                          }}
                        >
                          {(lesson.sectionName || "").toUpperCase()}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // СОЧ и Повторение
                  if (
                    lesson.rowType === "soch" ||
                    lesson.rowType === "repetition"
                  ) {
                    return (
                      <TableRow
                        key={lesson.id}
                        sx={{ backgroundColor: "#fffde7" }}
                      >
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
                        <TableCell></TableCell>
                      </TableRow>
                    );
                  }

                  // СОР
                  if (lesson.rowType === "sor") {
                    return (
                      <SortableTableRow
                        key={lesson.id}
                        id={lesson.id}
                        sx={{ backgroundColor: "#e3f2fd" }}
                      >
                        <TableCell>{lesson.lessonNumber}</TableCell>
                        <TableCell align="center">
                          {lesson.hoursInSection}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            borderLeft: "3px solid #1976d2",
                          }}
                        />
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
                              handleInputChange(
                                lesson.id,
                                "date",
                                e.target.value
                              )
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
                              handleInputChange(
                                lesson.id,
                                "notes",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell></TableCell>
                      </SortableTableRow>
                    );
                  }

                  // Стандартный урок + кнопка "Добавить СОР"
                  return (
                    <React.Fragment key={lesson.id}>
                      <SortableTableRow id={lesson.id}>
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
                          {isNewSection && lesson.sectionName}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            borderLeft: isNewTopic
                              ? "2px solid #81d4fa"
                              : "none",
                          }}
                        >
                          {isNewTopic && lesson.lessonTopic}
                        </TableCell>
                        <TableCell
                          sx={{
                            verticalAlign: "top",
                            borderLeft: isNewObjective
                              ? "1px solid #c5cae9"
                              : "none",
                          }}
                        >
                          {isNewObjective && (
                            <>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {lesson.objectiveId}
                              </Typography>
                              {lesson.objectiveDescription}
                            </>
                          )}
                        </TableCell>
                        <TableCell align="center">{lesson.hours}</TableCell>
                        <TableCell>
                          <TextField
                            variant="standard"
                            fullWidth
                            type="date"
                            value={lesson.date}
                            onChange={(e) =>
                              handleInputChange(
                                lesson.id,
                                "date",
                                e.target.value
                              )
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
                              handleInputChange(
                                lesson.id,
                                "notes",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Добавить час">
                            <IconButton
                              size="small"
                              onClick={() => handleAddHour(lesson.id)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить час">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteHour(lesson.id)}
                                disabled={objectiveHourCount <= 1}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </SortableTableRow>

                      {/* Блок, который рендерит кнопку в конце раздела */}
                      {isLastLessonInSection && (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            align="center"
                            sx={{
                              py: 0,
                              border: 0,
                              backgroundColor: "#fafafa",
                            }}
                          >
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
          </SortableContext>
        </DndContext>
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
