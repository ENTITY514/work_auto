// src/features/KtpEditor/index.tsx

import React from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { useAppSelector, useAppDispatch } from "../../shared/lib/hooks";
import { reorderPlan } from "../../entities/ktp/model/slice";
import { KtpTable } from "../../widgets/KTPTable";

export const KtpEditor: React.FC = () => {
  const dispatch = useAppDispatch();
  const plan = useAppSelector((state) => state.ktpEditor.plan);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      dispatch(
        reorderPlan({ activeId: String(active.id), overId: String(over.id) })
      );
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <KtpTable plan={plan} />
    </DndContext>
  );
};
