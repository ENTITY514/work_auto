import React from "react";
import { Container, Typography } from "@mui/material";
import { CalendarSettings } from "../../features/CalendarSettings";

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Настройки календаря
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Здесь вы можете настроить даты учебных четвертей и указать
        праздничные/выходные дни. Эти данные будут использоваться для
        автоматического распределения уроков в КТП.
      </Typography>
      <CalendarSettings />
    </Container>
  );
};

export default SettingsPage;
