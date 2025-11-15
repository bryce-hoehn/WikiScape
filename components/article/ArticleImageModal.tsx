import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import { Appbar } from 'react-native-paper';

interface ArticleImageModalProps {
  visible: boolean;
  selectedImage: { uri: string; alt?: string } | null;
  onClose: () => void;
}

export default function ArticleImageModal({
  visible,
  selectedImage,
  onClose
}: ArticleImageModalProps) {
  const closeButtonRef = useRef<any>(null);
  
  // Focus management for accessibility
  useEffect(() => {
    if (visible && closeButtonRef.current) {
      // Focus the close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus?.();
      }, 100);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      accessibilityViewIsModal={true}
      accessible={true}
      accessibilityLabel="Image modal"
    >
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        accessible={true}
        accessibilityLabel="Image modal content"
        importantForAccessibility="yes"
      >
        <Appbar.Header
          style={{
            backgroundColor: 'transparent',
            marginTop: 0,
            paddingTop: 0,
            elevation: 0,
          }}
          accessible={true}
          accessibilityRole="toolbar"
        >
          <Appbar.Action
            ref={closeButtonRef}
            icon="close"
            onPress={onClose}
            color="white"
            accessible={true}
            accessibilityLabel="Close image modal"
            accessibilityRole="button"
            accessibilityHint="Closes the image modal and returns to the article"
          />
          <Appbar.Content
            title={selectedImage?.alt || 'Image'}
            titleStyle={{ color: 'white' }}
            accessible={true}
            accessibilityRole="header"
          />
        </Appbar.Header>
        
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -56, // Compensate for Appbar height
          }}
          onPress={onClose}
          activeOpacity={1}
          accessible={true}
          accessibilityLabel="Close image modal"
          accessibilityRole="button"
          accessibilityHint="Tap to close the image modal"
        >
          {selectedImage && (
            <Image
              source={{ uri: selectedImage.uri }}
              style={{
                width: '100%',
                height: '80%'
              }}
              contentFit="contain"
              accessible={true}
              accessibilityLabel={selectedImage.alt || 'Article image'}
              accessibilityRole="image"
            />
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
