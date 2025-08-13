import React from "react";
import {
  TableCell,
  IconButton,
  Tooltip,
  styled,
  TableRow,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { SortableTableRow } from "../../../../components/sortableTableRow/sortableTableRow";
import { useAppDispatch } from "../../../../shared/lib/hooks";
import { updateLesson, addHour, deleteLesson, addSor } from "../../model/slice";
import { IKtpLesson, LessonRowType, KtpPlan } from "../../model/types";

interface KtpTableRowProps {
  lesson: IKtpLesson;
  prevLesson?: IKtpLesson;
  plan: KtpPlan;
}

const StyledTableCell = styled(TableCell)({
  borderRight: "1px solid #e0e0e0",
});

const StyledInput = styled("input")(({ theme }) => ({
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "2px solid transparent",
  padding: "4px 8px",
  fontFamily: "inherit",
  fontSize: "inherit",
  color: "inherit",
  "&:hover": {
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
  "&:focus": {
    outline: "none",
    borderBottom: `2px solid ${theme.palette.primary.main}`,
  },
}));

const getBackgroundColor = (rowType: LessonRowType) => {
  switch (rowType) {
    case LessonRowType.QUARTER_HEADER:
      return "#e0f2f1";
    case LessonRowType.SOCH:
    case LessonRowType.REPETITION:
      return "#e1f5fe";
    case LessonRowType.SOR:
      return "#fff9c4";
    default:
      return "#ffffff";
  }
};

const NonSortableTableRow: React.FC<{
  children: React.ReactNode;
  sx?: any;
}> = ({ children, sx }) => {
  return (
    <TableRow sx={sx}>
      <TableCell sx={{ cursor: "default" }}></TableCell>
      {children}
    </TableRow>
  );
};

export const KtpTableRow: React.FC<KtpTableRowProps> = ({
  lesson,
  prevLesson,
  plan,
}) => {
  const dispatch = useAppDispatch();
  const [isEditingSectionName, setIsEditingSectionName] = React.useState(false);
  const [isEditingLessonTopic, setIsEditingLessonTopic] = React.useState(false);
  const [isEditingObjective, setIsEditingObjective] = React.useState(false);
  const [isEditingDate, setIsEditingDate] = React.useState(false);
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [localSectionName, setLocalSectionName] = React.useState(
    lesson.sectionName
  );
  const [localLessonTopic, setLocalLessonTopic] = React.useState(
    lesson.lessonTopic
  );
  const [localObjectiveDescription, setLocalObjectiveDescription] =
    React.useState(lesson.objectiveDescription);
  const [localDate, setLocalDate] = React.useState(lesson.date);
  const [localNotes, setLocalNotes] = React.useState(lesson.notes);

  React.useEffect(() => {
    setLocalSectionName(lesson.sectionName);
  }, [lesson.sectionName]);

  React.useEffect(() => {
    setLocalLessonTopic(lesson.lessonTopic);
  }, [lesson.lessonTopic]);

  React.useEffect(() => {
    setLocalObjectiveDescription(lesson.objectiveDescription);
  }, [lesson.objectiveDescription]);

  React.useEffect(() => {
    setLocalDate(lesson.date);
  }, [lesson.date]);

  React.useEffect(() => {
    setLocalNotes(lesson.notes);
  }, [lesson.notes]);

  const [isOddSection, setIsOddSection] = React.useState(false);

  React.useEffect(() => {
    const uniqueSections = Array.from(
      new Set(
        plan
          .filter((l) => l.rowType !== LessonRowType.QUARTER_HEADER)
          .map((l) => l.sectionName)
      )
    );
    const sectionIndex = uniqueSections.indexOf(lesson.sectionName);
    setIsOddSection(sectionIndex % 2 !== 0);
  }, [lesson.sectionName, plan]);

  const handleInputChange = (
    field: keyof IKtpLesson,
    value: string | number
  ) => {
    dispatch(updateLesson({ id: lesson.id, field, value }));
  };

  const handleInputBlur = (field: keyof IKtpLesson) => {
    switch (field) {
      case "sectionName":
        setIsEditingSectionName(false);
        handleInputChange("sectionName", localSectionName);
        break;
      case "lessonTopic":
        setIsEditingLessonTopic(false);
        handleInputChange("lessonTopic", localLessonTopic);
        break;
      case "objectiveDescription":
        setIsEditingObjective(false);
        handleInputChange("objectiveDescription", localObjectiveDescription);
        break;
      case "date":
        setIsEditingDate(false);
        handleInputChange("date", localDate);
        break;
      case "notes":
        setIsEditingNotes(false);
        handleInputChange("notes", localNotes);
        break;
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    field: keyof IKtpLesson
  ) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  const isNewSection =
    !prevLesson ||
    (prevLesson.sectionName !== lesson.sectionName &&
      lesson.rowType !== LessonRowType.QUARTER_HEADER);
  const isNewTopic =
    !prevLesson || prevLesson.lessonTopic !== lesson.lessonTopic;

  const sectionHoursCount = React.useMemo(() => {
    if (lesson.rowType === LessonRowType.STANDARD) {
      return plan.filter(
        (l) =>
          l.sectionName === lesson.sectionName &&
          l.lessonNumber <= lesson.lessonNumber &&
          l.rowType === LessonRowType.STANDARD
      ).length;
    }
    return lesson.hoursInSection;
  }, [plan, lesson]);

  const handleAddHour = (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(addHour({ lessonId: lesson.id }));
  };

  const handleDeleteLesson = (event: React.MouseEvent) => {
    event.stopPropagation();
    const lessonsInSection = plan.filter(
      (l) =>
        l.sectionName === lesson.sectionName &&
        (l.rowType === LessonRowType.STANDARD ||
          l.rowType === LessonRowType.SOCH ||
          l.rowType === LessonRowType.SOR)
    );
    if (lessonsInSection.length > 1) {
      dispatch(deleteLesson({ lessonId: lesson.id }));
    } else {
      alert("Нельзя удалить последний урок в разделе.");
    }
  };

  const currentIndex = plan.findIndex((l) => l.id === lesson.id);
  const nextLesson = plan[currentIndex + 1];
  const isSectionEnd =
    (!nextLesson ||
      nextLesson.sectionName !== lesson.sectionName ||
      nextLesson.rowType === LessonRowType.QUARTER_HEADER) &&
    lesson.rowType !== LessonRowType.QUARTER_HEADER &&
    lesson.rowType !== LessonRowType.SOCH &&
    lesson.rowType !== LessonRowType.REPETITION;

  const handleAddSor = () => {
    dispatch(addSor({ lessonId: lesson.id }));
  };

  const renderCells = () => {
    if (lesson.rowType === LessonRowType.QUARTER_HEADER) {
      return (
        <StyledTableCell colSpan={9} sx={{ fontWeight: "bold" }}>
          {lesson.sectionName}
        </StyledTableCell>
      );
    }
    if (
      lesson.rowType === LessonRowType.REPETITION ||
      lesson.rowType === LessonRowType.SOCH
    ) {
      return (
        <>
          <StyledTableCell>{lesson.lessonNumber}</StyledTableCell>
          <StyledTableCell>{1}</StyledTableCell>
          <StyledTableCell
            colSpan={4}
            onDoubleClick={() => setIsEditingSectionName(true)}
          >
            {isEditingSectionName ? (
              <StyledInput
                type="text"
                value={localSectionName}
                onChange={(e) => setLocalSectionName(e.target.value)}
                onBlur={() => handleInputBlur("sectionName")}
                onKeyDown={(e) => handleKeyDown(e, "sectionName")}
                autoFocus
              />
            ) : (
              localSectionName
            )}
          </StyledTableCell>
          <StyledTableCell onDoubleClick={() => setIsEditingDate(true)}>
            {isEditingDate ? (
              <StyledInput
                type="text"
                value={localDate}
                onChange={(e) => setLocalDate(e.target.value)}
                onBlur={() => handleInputBlur("date")}
                onKeyDown={(e) => handleKeyDown(e, "date")}
                autoFocus
              />
            ) : (
              localDate
            )}
          </StyledTableCell>
          <StyledTableCell onDoubleClick={() => setIsEditingNotes(true)}>
            {isEditingNotes ? (
              <StyledInput
                type="text"
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={() => handleInputBlur("notes")}
                onKeyDown={(e) => handleKeyDown(e, "notes")}
                autoFocus
              />
            ) : (
              localNotes
            )}
          </StyledTableCell>
          <StyledTableCell>
            <Tooltip title="Добавить час">
              <IconButton size="small" onClick={handleAddHour}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить час">
              <span>
                <IconButton size="small" onClick={handleDeleteLesson}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </StyledTableCell>
        </>
      );
    }
    if (lesson.rowType === LessonRowType.SOR) {
      return (
        <>
          <StyledTableCell>{lesson.lessonNumber}</StyledTableCell>
          <StyledTableCell>{lesson.hoursInSection}</StyledTableCell>
          <StyledTableCell
            onDoubleClick={() => setIsEditingSectionName(true)}
          ></StyledTableCell>
          <StyledTableCell onDoubleClick={() => setIsEditingLessonTopic(true)}>
            {isEditingLessonTopic ? (
              <StyledInput
                type="text"
                value={localLessonTopic}
                onChange={(e) => setLocalLessonTopic(e.target.value)}
                onBlur={() => handleInputBlur("lessonTopic")}
                onKeyDown={(e) => handleKeyDown(e, "lessonTopic")}
                autoFocus
              />
            ) : (
              localLessonTopic
            )}
          </StyledTableCell>
          <StyledTableCell onDoubleClick={() => setIsEditingObjective(true)}>
            {isEditingObjective ? (
              <StyledInput
                type="text"
                value={localObjectiveDescription}
                onChange={(e) => setLocalObjectiveDescription(e.target.value)}
                onBlur={() => handleInputBlur("objectiveDescription")}
                onKeyDown={(e) => handleKeyDown(e, "objectiveDescription")}
                autoFocus
              />
            ) : (
              <>
                <span style={{ fontWeight: "bold" }}>
                  {lesson.objectiveId}{" "}
                </span>
                {localObjectiveDescription}
              </>
            )}
          </StyledTableCell>
          <StyledTableCell>{lesson.hours}</StyledTableCell>
          <StyledTableCell onDoubleClick={() => setIsEditingDate(true)}>
            {isEditingDate ? (
              <StyledInput
                type="text"
                value={localDate}
                onChange={(e) => setLocalDate(e.target.value)}
                onBlur={() => handleInputBlur("date")}
                onKeyDown={(e) => handleKeyDown(e, "date")}
                autoFocus
              />
            ) : (
              localDate
            )}
          </StyledTableCell>
          <StyledTableCell></StyledTableCell>
          <StyledTableCell>
            <Tooltip title="Добавить час">
              <IconButton size="small" onClick={handleAddHour}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить час">
              <span>
                <IconButton size="small" onClick={handleDeleteLesson}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </StyledTableCell>
        </>
      );
    }
    return (
      <>
        <StyledTableCell>{lesson.lessonNumber}</StyledTableCell>
        <StyledTableCell>{sectionHoursCount}</StyledTableCell>
        <StyledTableCell onDoubleClick={() => setIsEditingSectionName(true)}>
          {isEditingSectionName ? (
            <StyledInput
              type="text"
              value={localSectionName}
              onChange={(e) => setLocalSectionName(e.target.value)}
              onBlur={() => handleInputBlur("sectionName")}
              onKeyDown={(e) => handleKeyDown(e, "sectionName")}
              autoFocus
            />
          ) : isNewSection ? (
            localSectionName
          ) : (
            ""
          )}
        </StyledTableCell>
        <StyledTableCell onDoubleClick={() => setIsEditingLessonTopic(true)}>
          {isEditingLessonTopic ? (
            <StyledInput
              type="text"
              value={localLessonTopic}
              onChange={(e) => setLocalLessonTopic(e.target.value)}
              onBlur={() => handleInputBlur("lessonTopic")}
              onKeyDown={(e) => handleKeyDown(e, "lessonTopic")}
              autoFocus
            />
          ) : isNewTopic ? (
            localLessonTopic
          ) : (
            ""
          )}
        </StyledTableCell>
        <StyledTableCell onDoubleClick={() => setIsEditingObjective(true)}>
          {isEditingObjective ? (
            <StyledInput
              type="text"
              value={localObjectiveDescription}
              onChange={(e) => setLocalObjectiveDescription(e.target.value)}
              onBlur={() => handleInputBlur("objectiveDescription")}
              onKeyDown={(e) => handleKeyDown(e, "objectiveDescription")}
              autoFocus
            />
          ) : (
            <>
              <span style={{ fontWeight: "bold" }}>{lesson.objectiveId} </span>
              {localObjectiveDescription}
            </>
          )}
        </StyledTableCell>
        <StyledTableCell>{lesson.hours}</StyledTableCell>
        <StyledTableCell onDoubleClick={() => setIsEditingDate(true)}>
          {isEditingDate ? (
            <StyledInput
              type="text"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              onBlur={() => handleInputBlur("date")}
              onKeyDown={(e) => handleKeyDown(e, "date")}
              autoFocus
            />
          ) : (
            localDate
          )}
        </StyledTableCell>
        <StyledTableCell onDoubleClick={() => setIsEditingNotes(true)}>
          {isEditingNotes ? (
            <StyledInput
              type="text"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => handleInputBlur("notes")}
              onKeyDown={(e) => handleKeyDown(e, "notes")}
              autoFocus
            />
          ) : (
            localNotes
          )}
        </StyledTableCell>
        <StyledTableCell>
          <Tooltip title="Добавить час">
            <IconButton size="small" onClick={handleAddHour}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить час">
            <span>
              <IconButton size="small" onClick={handleDeleteLesson}>
                <RemoveIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </StyledTableCell>
      </>
    );
  };
  const rowBackgroundColor =
    lesson.rowType === LessonRowType.STANDARD
      ? isOddSection
        ? "#f5f5f5"
        : "#ffffff"
      : getBackgroundColor(lesson.rowType);

  return (
    <>
      {lesson.rowType === LessonRowType.QUARTER_HEADER ? (
        <NonSortableTableRow sx={{ backgroundColor: rowBackgroundColor }}>
          {renderCells()}
        </NonSortableTableRow>
      ) : (
        <SortableTableRow
          id={lesson.id}
          sx={{
            backgroundColor: rowBackgroundColor,
          }}
        >
          {renderCells()}
        </SortableTableRow>
      )}

      {isSectionEnd && (
        <TableRow>
          <TableCell colSpan={10} sx={{ p: 0 }}>
            <Box
              sx={{
                width: "200px",
                height: "30px",
                backgroundColor: "#2196f3",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0 0 15px 15px",
                margin: "0 auto",
                cursor: "pointer",
                zIndex: 1,
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              }}
              onClick={handleAddSor}
            >
              Добавить СОР
            </Box>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
