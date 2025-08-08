import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableRow } from "@mui/material";
// ✅ 1. Импортируем типы для sx пропа
import { SxProps, Theme } from "@mui/material/styles";

interface SortableTableRowProps {
  children: React.ReactNode;
  id: string;
  // ✅ 2. Добавляем sx в список разрешенных пропсов
  sx?: SxProps<Theme>;
}

export const SortableTableRow: React.FC<SortableTableRowProps> = ({
  children,
  id,
  sx,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
    // Если ячейки в строке смещаются, добавьте эту строку
    display: "table-row",
    width: "100%",
  };

  return (
    // ✅ 3. Принимаем sx и передаем его в TableRow
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={sx}
    >
      {children}
    </TableRow>
  );
};
