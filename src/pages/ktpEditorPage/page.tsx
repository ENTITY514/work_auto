// src/pages/KtpEditorPage/page.tsx

import React, { useEffect, useState } from "react"; // <-- NEW IMPORT useState
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  FormControl, // <-- NEW IMPORT
  InputLabel, // <-- NEW IMPORT
  Select, // <-- NEW IMPORT
  MenuItem, // <-- NEW IMPORT
  OutlinedInput, // <-- NEW IMPORT
  Chip,
  Paper, // <-- NEW IMPORT
} from "@mui/material";
import { useAppSelector, useAppDispatch } from "../../shared/lib/hooks";
import { initKtpPlan, autofillDates } from "../../entities/ktp/model/slice"; // <-- UPDATE: added autofillDates
import { KtpEditor } from "../../features/KTPEditor";
import { DayOfWeek } from "../../entities/ktp/model/types"; // <-- NEW IMPORT

const KtpEditorPage: React.FC = () => {
  const { tupId } = useParams<{ tupId: string }>();
  const dispatch = useAppDispatch();

  const { status, error, sourceTupName, plan } = useAppSelector(
    (state) => state.ktpEditor
  );
  // 💡 НОВОЕ: Получаем данные календаря из Redux
  const calendarState = useAppSelector((state) => state.calendar);
  const activeProfile = calendarState.profiles.find(
    (p) => p.id === calendarState.activeProfileId
  );
  const quarters = activeProfile ? Object.keys(activeProfile.quarters) : [];

  // 💡 НОВОЕ: Локальные состояния для настроек автозаполнения
  const [selectedProfile, setSelectedProfile] = useState(
    calendarState.activeProfileId || ""
  );
  const [startQuarter, setStartQuarter] = useState(quarters[0] || "");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    if (tupId) {
      dispatch(initKtpPlan(tupId));
    }
  }, [dispatch, tupId]);

  const handleAutofill = () => {
    if (activeProfile && selectedDays.length > 0 && startQuarter) {
      dispatch(
        autofillDates({
          startQuarter: startQuarter as "q1" | "q2" | "q3" | "q4",
          selectedDays,
          calendarProfile: activeProfile,
          holidays: calendarState.holidays,
        })
      );
    }
  };

  let content;

  if (status === "loading") {
    content = <CircularProgress />;
  } else if (status === "succeeded") {
    content = <KtpEditor />;
  } else if (status === "failed") {
    content = <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Редактор КТП на основе: "{sourceTupName || "..."}"
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Настройки автоматического заполнения
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Профиль календаря</InputLabel>
            <Select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              label="Профиль календаря"
              disabled={calendarState.profiles.length === 0}
            >
              {calendarState.profiles.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Начать с четверти</InputLabel>
            <Select
              value={startQuarter}
              onChange={(e) => setStartQuarter(e.target.value as string)}
              label="Начать с четверти"
              disabled={quarters.length === 0}
            >
              {quarters.map((q, index) => (
                <MenuItem key={q} value={q}>
                  Четверть {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Выбор дней недели */}
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Дни проведения уроков</InputLabel>
            <Select
              multiple
              value={selectedDays}
              onChange={(e) => setSelectedDays(e.target.value as DayOfWeek[])}
              input={<OutlinedInput label="Дни проведения уроков" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {[
                "понедельник",
                "вторник",
                "среда",
                "четверг",
                "пятница",
                "суббота",
                "воскресенье",
              ].map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleAutofill}
            disabled={
              !selectedProfile || selectedDays.length === 0 || !startQuarter
            }
          >
            Автозаполнение дат
          </Button>
        </Box>
      </Paper>

      {content}

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => console.log(plan)} // Логика сохранения остается без изменений
        >
          Сохранить КТП
        </Button>
      </Box>
    </Container>
  );
};

export default KtpEditorPage;
