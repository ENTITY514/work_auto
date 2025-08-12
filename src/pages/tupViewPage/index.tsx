// src/pages/TupViewPage/index.tsx

import React from "react";
import { useParams } from "react-router-dom";
import { Container, Typography, CircularProgress, Alert } from "@mui/material";
import { useAppSelector } from "../../shared/lib/hooks";
import { CreateKtpFromTup } from "../../features/CreateKtpFromTup";
import { selectTupByIndex } from "../../entities/circulumPlan/model/selectors";
import HierarchicalPlanView from "../../entities/circulumPlan/ui/hierarchPlanView";

const TupViewPage: React.FC = () => {
  const { tupId } = useParams<{ tupId: string }>();

  const tupIndex = tupId ? parseInt(tupId, 10) : NaN;

  const tupData = useAppSelector((state) =>
    !isNaN(tupIndex) ? selectTupByIndex(state, tupIndex) : undefined
  );
  const isTupListEmpty = useAppSelector(
    (state) => state.academicPlan.tupList.length === 0
  );

  if (isNaN(tupIndex)) {
    return <Alert severity="error">Некорректный ID для ТУП.</Alert>;
  }

  if (!tupData) {
    if (isTupListEmpty) {
      return <CircularProgress />;
    }
    return <Alert severity="error">ТУП с таким номером не найден.</Alert>;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Просмотр ТУП: "{tupData.name}"
      </Typography>

      <HierarchicalPlanView data={tupData.planData} />

      <CreateKtpFromTup tupId={tupId!} />
    </Container>
  );
};

export default TupViewPage;
