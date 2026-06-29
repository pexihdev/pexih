import React, { useState, useCallback } from 'react';
import ConfirmPopup from '@/components/ConfirmPopup';

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((title: string, message: string, isDestructive = true): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        isDestructive,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(true);
      setConfirmState(null);
    }
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(false);
      setConfirmState(null);
    }
  }, [confirmState]);

  const ConfirmDialog = useCallback(() => {
    if (!confirmState) return null;
    return (
      <ConfirmPopup
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDestructive={confirmState.isDestructive}
      />
    );
  }, [confirmState, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialog };
}
