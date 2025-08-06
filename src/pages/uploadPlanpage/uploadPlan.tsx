import React, { useState, useEffect } from "react";
import { Box, Typography, Container } from "@mui/material";
import FileUploadContainer from "../../components/fileUpload/fileUploadContainer";
import { AcademicPlan } from "../../interfaces/academic_plan.interface";
import HierarchicalPlanView from "../../components/hierarchPlanView/hierarchPlanView";

const UploadPlanPage: React.FC = () => {
  // ✅ Указываем новый тип для состояния
  const [planData, setPlanData] = useState<AcademicPlan | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("academicPlanData");
    if (savedData) {
      try {
        setPlanData(JSON.parse(savedData));
      } catch (e) {
        localStorage.removeItem("academicPlanData");
      }
    }
  }, []);

  const handleUploadSuccess = (data: AcademicPlan) => {
    setPlanData(data);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Загрузка и структура учебного плана
        </Typography>

        {/* Если данных еще нет, показываем загрузчик */}
        {!planData && (
          <FileUploadContainer onUploadSuccess={handleUploadSuccess} />
        )}

        {/* ✅ Если данные есть, показываем новый иерархический компонент */}
        {planData && (
          <>
            <Typography variant="h6" color="green" gutterBottom>
              План успешно загружен и структурирован.
            </Typography>
            <HierarchicalPlanView data={planData} />
          </>
        )}
      </Box>
    </Container>
  );
};

export default UploadPlanPage;
