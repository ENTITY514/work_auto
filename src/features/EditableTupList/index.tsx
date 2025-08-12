// src/features/EditableTupList/index.tsx

import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import EditIcon from "@mui/icons-material/Edit";
import { renameTup } from "../../entities/circulumPlan/model/slice";
import { useAppDispatch, useAppSelector } from "../../shared/lib/hooks";

export const EditableTupList: React.FC = () => {
  const dispatch = useAppDispatch();
  const tupList = useAppSelector((state) => state.academicPlan.tupList); // Путь зависит от твоего store
  const [editingTupId, setEditingTupId] = useState<string | null>(null);

  const handleNameChange = (id: string, newName: string) => {
    // Временное изменение в локальном состоянии для отзывчивости UI
    // Но реальное изменение будет по onBlur/Enter через Redux
  };

  const handleFinishEditing = (id: string, newName: string) => {
    dispatch(renameTup({ id, newName }));
    setEditingTupId(null);
  };

  if (tupList.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Загруженных ТУП пока нет.
      </Typography>
    );
  }

  return (
    <List>
      {tupList.map((tup, index) => (
        <ListItem
          key={tup.id}
          disablePadding
          secondaryAction={
            <IconButton edge="end" onClick={() => setEditingTupId(tup.id)}>
              <EditIcon />
            </IconButton>
          }
        >
          {editingTupId === tup.id ? (
            <TextField
              defaultValue={tup.name}
              onBlur={(e) => handleFinishEditing(tup.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFinishEditing(
                    tup.id,
                    (e.target as HTMLInputElement).value
                  );
                }
              }}
              variant="outlined"
              size="small"
              autoFocus
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
  );
};
