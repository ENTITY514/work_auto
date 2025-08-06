import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School"; // Пример иконки
import { Link as RouterLink } from "react-router-dom"; // Используем Link из роутера

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        {/* Иконка-заглушка */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          component={RouterLink}
          to="/"
          sx={{ mr: 2 }}
        >
          <SchoolIcon />
        </IconButton>

        {/* Название приложения (можно убрать или изменить) */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Редактор КТП
        </Typography>

        {/* Навигационные ссылки */}
        <Box>
          <Button color="inherit" component={RouterLink} to="/ktp">
            КТП
          </Button>
          {/* Здесь можно будет добавить другие ссылки, например, "Настройки" */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
