// src/pages/KtpPage/index.tsx (Новый файл, заменяющий старый page.tsx)

import React from "react";
import { Container, Typography, Paper } from "@mui/material";
import { UploadTup } from "../../features/UploadTup";
import { EditableTupList } from "../../features/EditableTupList";

// Временный компонент для заглушки
const GeneratedKtpList: React.FC = () => {
  const ktpMockList = [
    { id: 1, name: "КТП по Математике 7А класс (2024-2025)" },
    { id: 2, name: "КТП по Биологии 7А класс (2024-2025)" },
  ];
  // ... логика отображения ...
  return <Typography>Здесь будет список сформированных КТП.</Typography>;
};

const KtpPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Календарно-тематические планы
      </Typography>

      <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Загрузить новый ТУП
        </Typography>
        <UploadTup />
      </Paper>

      <Paper elevation={2} sx={{ mb: 4, p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Загруженные ТУП
        </Typography>
        <EditableTupList />
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Сформированные КТП
        </Typography>
        <GeneratedKtpList />
      </Paper>
    </Container>
  );
};

export default KtpPage;
