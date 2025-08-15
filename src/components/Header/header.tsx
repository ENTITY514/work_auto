import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import { Link as RouterLink } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
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

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Редактор КТП
        </Typography>

        <Box>
          <Button color="inherit" component={RouterLink} to="/ktp">
            КТП
          </Button>
          <Button color="inherit" component={RouterLink} to="/grade-analyzer">
            Анализ журнала
          </Button>
          <Button color="inherit" component={RouterLink} to="/settings">
            {" "}
            {/* <-- ДОБАВИТЬ КНОПКУ */}
            Настройки
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
