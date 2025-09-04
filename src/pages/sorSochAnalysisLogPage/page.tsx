import React, { useState, useCallback } from 'react';
import { Container, Typography, Alert } from '@mui/material';
import FileUploaderUI from '../../modules/FileUploaderUI';
import { parseSorSochAnalysis } from '../../shared/api/sorSochAnalysisParser';

const SorSochAnalysisLogPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setMessage(null);
    setError(null);
    try {
      await parseSorSochAnalysis(file);
      setMessage("Файл успешно обработан. Пожалуйста, проверьте консоль разработчика (F12) на наличие логов.");
    } catch (err: any) {
      setError(err.message || "Не удалось обработать файл.");
    }
  }, []);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Тестовая страница для анализа СОР/СОЧ
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Загрузите сюда эталонный документ с анализом СОР/СОЧ. Его структура будет выведена в консоль для дальнейшей разработки.
      </Typography>
      <FileUploaderUI 
        onFileSelect={handleFileSelect} 
        selectedFile={selectedFile}
        isUploaded={!!message}
      />
      {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Container>
  );
};

export default SorSochAnalysisLogPage;
