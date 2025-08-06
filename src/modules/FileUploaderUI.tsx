import React, { useCallback } from 'react';
import { Box, Typography, Button, Paper, LinearProgress, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';


const DropzoneArea = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: '#fafafa',
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: '#f0f0f0',
  },
}));

interface FileUploaderUIProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isUploaded: boolean;
}

const FileUploaderUI: React.FC<FileUploaderUIProps> = ({ onFileSelect, selectedFile, isUploaded }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Обработчики для drag-and-drop
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  }, [onFileSelect]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };
  
  return (
    <Box sx={{ maxWidth: 600, margin: 'auto' }}>
      <DropzoneArea onDragOver={handleDragOver} onDrop={handleDrop} onClick={openFileDialog}>
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          hidden
        />
        <CloudUploadIcon color="primary" sx={{ fontSize: 50 }} />
        <Typography variant="h6">Drag & Drop your file here</Typography>
        <Typography variant="body2" color="textSecondary">or</Typography>
        <Button variant="contained" sx={{ mt: 2 }}>
          Browse Files
        </Button>
      </DropzoneArea>

      {selectedFile && (
        <ListItem sx={{ mt: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <InsertDriveFileIcon sx={{ mr: 2 }}/>
            <ListItemText
              primary={selectedFile.name}
              secondary={`${(selectedFile.size / 1024).toFixed(2)} KB`}
            />
            <Box sx={{ width: '30%', mr: 2 }}>
               <LinearProgress variant="determinate" value={isUploaded ? 100 : 0} />
            </Box>
            {isUploaded && <CheckCircleIcon color="success" />}
        </ListItem>
      )}
    </Box>
  );
};

export default FileUploaderUI;