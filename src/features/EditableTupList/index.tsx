// src/features/EditableTupList/index.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { createKtpFromTup } from "../../entities/ktp/model/slice";
import { useAppDispatch, useAppSelector } from "../../shared/lib/hooks";

export const EditableTupList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tupList = useAppSelector((state) => state.academicPlan.tupList);
  const [editingTupId, setEditingTupId] = useState<string | null>(null);

  const handleFinishEditing = (id: string, newName: string) => {
    dispatch(renameTup({ id, newName }));
    setEditingTupId(null);
  };

  const handleCreateKtp = async (tupId: string) => {
    const resultAction = await dispatch(createKtpFromTup(tupId));
    if (createKtpFromTup.fulfilled.match(resultAction)) {
      const newKtp = resultAction.payload;
      navigate(`/ktp-editor/${newKtp.id}`);
    }
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
            <ListItemButton onClick={() => handleCreateKtp(index.toString())}>
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