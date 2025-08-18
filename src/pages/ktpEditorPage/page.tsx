// src/pages/KtpEditorPage/page.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Paper,
} from "@mui/material";
import { useAppSelector, useAppDispatch } from "../../shared/lib/hooks";
import {
  initKtpPlan,
  autofillDates,
  clearAutofillError,
} from "../../entities/ktp/model/slice";
import { KtpEditor } from "../../features/KTPEditor";
import { DayOfWeek } from "../../entities/ktp/model/types";
import NotificationModal from "../../components/NotificationModal/NotificationModal";

const KtpEditorPage: React.FC = () => {
  const { tupId } = useParams<{ tupId: string }>();
  const dispatch = useAppDispatch();

  const { status, error, sourceTupName, plan, autofillError } = useAppSelector(
    (state) => state.ktpEditor
  );
  const calendarState = useAppSelector((state) => state.calendar);
  const activeProfile = calendarState.profiles.find(
    (p) => p.id === calendarState.activeProfileId
  );
  const quarters = activeProfile ? Object.keys(activeProfile.quarters) : [];

  const [selectedProfile, setSelectedProfile] = useState(
    calendarState.activeProfileId || ""
  );
  const [startQuarter, setStartQuarter] = useState(quarters[0] || "");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  // 💡 НОВОЕ: Состояния для модального окна уведомлений
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<
    "info" | "success" | "error"
  >("info");

  useEffect(() => {
    if (tupId) {
      dispatch(initKtpPlan(tupId));
    }
  }, [dispatch, tupId]);

  // 💡 НОВОЕ: useEffect для отслеживания ошибок автозаполнения
  useEffect(() => {
    if (autofillError) {
      setNotificationMessage(autofillError);
      setNotificationType("error");
      setNotificationOpen(true);
    }
  }, [autofillError]);

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

  const handleNotificationClose = () => {
    setNotificationOpen(false);
    // 💡 НОВОЕ: Очищаем ошибку из Redux, когда пользователь закрыл уведомление
    dispatch(clearAutofillError());
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
          onClick={() => console.log(plan)}
        >
          Сохранить КТП
        </Button>
      </Box>

      {/* 💡 НОВОЕ: Отображение модального окна уведомлений */}
      <NotificationModal
        open={notificationOpen}
        onClose={handleNotificationClose}
        message={notificationMessage}
        type={notificationType}
      />
    </Container>
  );
};

export default KtpEditorPage;
