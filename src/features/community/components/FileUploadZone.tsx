import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FileUploadZoneProps {
  selectedFileName?: string;
  selectedFileSize?: string;
  onPickFile: () => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  selectedFileName,
  selectedFileSize,
  onPickFile,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.zone, selectedFileName ? styles.zoneSelected : null]}
      onPress={onPickFile}
    >
      {selectedFileName ? (
        <View style={styles.selectedContent}>
          <View style={styles.pdfIconCircle}>
            <Feather name="file-text" size={28} color="#0745E8" />
          </View>
          <Text style={styles.fileName}>{selectedFileName}</Text>
          {selectedFileSize && <Text style={styles.fileSize}>{selectedFileSize}</Text>}

          <View style={styles.changeBtn}>
            <Feather name="refresh-cw" size={12} color="#0745E8" />
            <Text style={styles.changeText}>Choose Different PDF</Text>
          </View>
        </View>
      ) : (
        <View style={styles.dropContent}>
          <View style={styles.uploadCircle}>
            <Feather name="upload-cloud" size={32} color="#0745E8" />
          </View>

          <Text style={styles.title}>Tap to Select PDF Document</Text>
          <Text style={styles.sub}>
            Supports PDF files up to 25 MB (Handwritten Notes, Formula Sheets, Solved Question Banks)
          </Text>

          <View style={styles.browseBtn}>
            <Feather name="folder" size={14} color="#FFFFFF" />
            <Text style={styles.browseText}>Browse Files</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  zone: {
    backgroundColor: '#FAF5FF',
    borderColor: '#BFDBFE',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  zoneSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
    borderStyle: 'solid',
  },
  dropContent: {
    alignItems: 'center',
  },
  uploadCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  browseBtn: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  browseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  selectedContent: {
    alignItems: 'center',
  },
  pdfIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
});
