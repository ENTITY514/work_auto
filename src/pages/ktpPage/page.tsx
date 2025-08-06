import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  ListItemButton,
  TextField,
  IconButton,
} from "@mui/material";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import ArticleIcon from "@mui/icons-material/Article";
import EditIcon from "@mui/icons-material/Edit";
import FileUploadContainer from "../../components/fileUpload/fileUploadContainer";
import {
  StoredTup,
  AcademicPlan,
} from "../../interfaces/academic_plan.interface";

const KtpPage: React.FC = () => {
  const [tupList, setTupList] = useState<StoredTup[]>([]);
  // ✅ Новое состояние, чтобы отслеживать, какой элемент редактируется
  const [editingTupId, setEditingTupId] = useState<string | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("academicPlanData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as StoredTup[];
        if (Array.isArray(parsedData) && parsedData[0]?.planData) {
          setTupList(parsedData);
        }
      } catch (e) {
        console.error("Ошибка парсинга ТУП из localStorage:", e);
      }
    }
  }, []);

  const updateLocalStorage = (list: StoredTup[]) => {
    localStorage.setItem("academicPlanData", JSON.stringify(list));
  };

  const handleUploadSuccess = (newPlan: AcademicPlan) => {
    const newTup: StoredTup = {
      id: Date.now().toString(), // Простой уникальный ID
      name: `Новый учебный план от ${new Date().toLocaleDateString()}`,
      planData: newPlan,
    };

    setTupList((prevTupList) => {
      const updatedList = [...prevTupList, newTup];
      updateLocalStorage(updatedList);
      return updatedList;
    });

    // ✅ Сразу после добавления включаем режим редактирования для нового элемента
    setEditingTupId(newTup.id);
  };

  const handleNameChange = (id: string, newName: string) => {
    const updatedList = tupList.map((tup) =>
      tup.id === id ? { ...tup, name: newName } : tup
    );
    setTupList(updatedList);
  };

  const handleFinishEditing = () => {
    updateLocalStorage(tupList);
    setEditingTupId(null);
  };

  const ktpMockList = [
    { id: 1, name: "КТП по Математике 7А класс (2024-2025)" },
    { id: 2, name: "КТП по Биологии 7А класс (2024-2025)" },
  ];

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Календарно-тематические планы
      </Typography>

      <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Загрузить новый ТУП
        </Typography>
        <FileUploadContainer onUploadSuccess={handleUploadSuccess} />
      </Paper>

      <Paper elevation={2} sx={{ mb: 4, p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Загруженные ТУП
        </Typography>
        {tupList.length > 0 ? (
          <List>
            {tupList.map((tup, index) => (
              <ListItem
                key={tup.id}
                disablePadding
                secondaryAction={
                  // ✅ Кнопка для старта редактирования
                  <IconButton
                    edge="end"
                    onClick={() => setEditingTupId(tup.id)}
                  >
                    <EditIcon />
                  </IconButton>
                }
              >
                {/* ✅ Вместо простого текста теперь у нас логика с полем ввода */}
                {editingTupId === tup.id ? (
                  <TextField
                    value={tup.name}
                    onChange={(e) => handleNameChange(tup.id, e.target.value)}
                    onBlur={handleFinishEditing}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleFinishEditing()
                    }
                    variant="outlined"
                    size="small"
                    autoFocus // ✅ Тот самый автофокус
                    sx={{ ml: 2, flexGrow: 1 }}
                  />
                ) : (
                  <ListItemButton component={RouterLink} to={`/tup/${index}`}>
                    <ListItemIcon>
                      <BackupTableIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={tup.name}
                      secondary={`Содержит ${tup.planData.length} четвертей`}
                    />
                  </ListItemButton>
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Загруженных ТУП пока нет.
          </Typography>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Сформированные КТП
        </Typography>
        <List>
          {ktpMockList.map((ktp) => (
            <ListItem key={ktp.id} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <ArticleIcon />
                </ListItemIcon>
                <ListItemText primary={ktp.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default KtpPage;
