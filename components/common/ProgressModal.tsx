import React from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, useTheme } from 'react-native-paper';
import ProgressIndicator from './ProgressIndicator';

interface ProgressModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  /**
   * Progress value between 0 and 1
   */
  progress: number;
  /**
   * Message to display
   */
  message?: string;
  /**
   * Whether to show percentage
   */
  showPercentage?: boolean;
  /**
   * Optional cancel handler
   */
  onCancel?: () => void;
  /**
   * Cancel button label
   */
  cancelLabel?: string;
}

/**
 * Modal component for showing progress of long-running operations
 * Provides a consistent UI for operations like export/import, download all, etc.
 */
export default function ProgressModal({
  visible,
  progress,
  message,
  showPercentage = true,
  onCancel,
  cancelLabel = 'Cancel',
}: ProgressModalProps) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancel}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          padding: 24,
          margin: 20,
          borderRadius: theme.roundness,
          alignItems: 'center',
        }}
      >
        <ProgressIndicator progress={progress} message={message} showPercentage={showPercentage} />
        {onCancel && (
          <Button mode="outlined" onPress={onCancel} style={{ marginTop: 16 }}>
            {cancelLabel}
          </Button>
        )}
      </Modal>
    </Portal>
  );
}
