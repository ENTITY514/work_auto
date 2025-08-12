// src/pages/KtpEditorPage/index.tsx

import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
} from "@mui/material";
import { useAppSelector, useAppDispatch } from "../../shared/lib/hooks";
import { initKtpPlan } from "../../entities/ktp/model/slice";
import { KtpEditor } from "../../features/KTPEditor";

const KtpEditorPage: React.FC = () => {
  const { tupId } = useParams<{ tupId: string }>();
  const dispatch = useAppDispatch();

  const { status, error, sourceTupName, plan } = useAppSelector(
    (state) => state.ktpEditor
  );

  useEffect(() => {
    if (tupId) {
      dispatch(initKtpPlan(tupId));
    }
  }, [dispatch, tupId]);

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

      {content}

      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => console.log(plan)} // Логика сохранения будет здесь
        >
          Сохранить КТП
        </Button>
      </Box>
    </Container>
  );
};

export default KtpEditorPage;
