import React from "react";
import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./components/Header/header";
import KtpEditorPage from "./pages/ktpEditorPage/page";
import KtpPage from "./pages/ktpPage/page";
import TupViewPage from "./pages/tupViewPage/page";
import GradeAnalyzerPage from "./pages/gradeAnalyzatorPage/page";

function App() {
  return (
    <>
      <Header />
      <Box component="main" sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<KtpPage />} />
          <Route path="/ktp" element={<KtpPage />} />
          <Route path="/tup/:tupId" element={<TupViewPage />} />
          <Route path="/ktp-editor/:tupId" element={<KtpEditorPage />} />
          {/* ✅ Новый маршрут для анализатора журнала */}
          <Route path="/grade-analyzer" element={<GradeAnalyzerPage />} />
        </Routes>
      </Box>
    </>
  );
}

export default App;
