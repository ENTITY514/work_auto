import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../shared/lib/hooks';
import { loadKtpsFromLocalStorage, setKtpForEditing, updateKtpName, deleteKtp, SavedKtp } from '../../entities/ktp/model/slice';
import { List, ListItem, ListItemText, IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { RootState } from '../../store/store';

export const SavedKtpList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { savedKtps } = useAppSelector((state: RootState) => state.ktpEditor);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    dispatch(loadKtpsFromLocalStorage());
  }, [dispatch]);

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSave = (id: string) => {
    dispatch(updateKtpName({ id, name: editingName }));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteKtp(id));
  };

  const handleOpenEditor = (id: string) => {
    dispatch(setKtpForEditing(id));
    navigate(`/ktp-editor/${id}`);
  };

  return (
    <List>
      {savedKtps.map((ktp: SavedKtp) => (
        <ListItem key={ktp.id} onDoubleClick={() => handleEdit(ktp.id, ktp.name)} onClick={() => handleOpenEditor(ktp.id)}>
          {editingId === ktp.id ? (
            <TextField
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleSave(ktp.id)}
              autoFocus
            />
          ) : (
            <ListItemText primary={ktp.name} />
          )}
          <IconButton onClick={() => (editingId === ktp.id ? handleSave(ktp.id) : handleEdit(ktp.id, ktp.name))}>
            {editingId === ktp.id ? <SaveIcon /> : <EditIcon />}
          </IconButton>
          <IconButton onClick={() => handleDelete(ktp.id)}>
            <DeleteIcon />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
};