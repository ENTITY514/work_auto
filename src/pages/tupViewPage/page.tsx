import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import HierarchicalPlanView from "../../components/hierarchPlanView/hierarchPlanView";
import {
  AcademicPlan,
  StoredTup,
} from "../../interfaces/academic_plan.interface";

const TupViewPage: React.FC = () => {
  const { tupId } = useParams<{ tupId: string }>();
  const navigate = useNavigate();

  const [tup, setTup] = useState<AcademicPlan | null>(null);
  const [tupName, setTupName] = useState<string>(""); // Состояние для имени
  const [error, setError] = useState<string>("");

  useEffect(() => {
    try {
      const savedData = localStorage.getItem("academicPlanData");
      if (savedData && tupId) {
        // ✅ Работаем с новой структурой StoredTup[]
        const allTups = JSON.parse(savedData) as StoredTup[];
        const tupIndex = parseInt(tupId, 10);

        if (allTups[tupIndex]) {
          // ✅ ИЗМЕНЕНИЕ: В состояние сохраняем только сам план, а имя - отдельно
          setTup(allTups[tupIndex].planData);
          setTupName(allTups[tupIndex].name);
        } else {
          setError("ТУП с таким номером не найден.");
        }
      }
    } catch (e) {
      setError("Не удалось загрузить данные из хранилища.");
    }
  }, [tupId]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!tup) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        {/* ✅ Показываем сохраненное имя ТУП */}
        Просмотр ТУП: "{tupName}"
      </Typography>

      <HierarchicalPlanView data={tup} />

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate(`/ktp-editor/${tupId}`)}
        >
          Создать КТП из этого ТУП
        </Button>
      </Box>
    </Container>
  );
};

export default TupViewPage;
