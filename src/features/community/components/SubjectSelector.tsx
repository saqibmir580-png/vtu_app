import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { fetchSubjectsFromApi } from '@/features/notes/api/notesApi';
import { Subject } from '@/features/notes/types/notes.types';

interface SubjectSelectorProps {
  selectedCode: string;
  onSelectSubject: (code: string, name: string) => void;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  selectedCode,
  onSelectSubject,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchSubjectsFromApi({ semester: 5, branchCode: 'CSE', schemeYear: '2022' })
      .then((data) => {
        if (isMounted && data.length > 0) {
          setSubjects(data);
          if (!selectedCode && data[0]) {
            onSelectSubject(data[0].code, data[0].name);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select VTU Subject</Text>
      {isLoading && subjects.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7C3AED" />
        </View>
      ) : (
        <View style={styles.grid}>
          {subjects.map((sub) => {
            const isSelected = selectedCode === sub.code;
            return (
              <TouchableOpacity
                key={sub.id}
                activeOpacity={0.8}
                style={[styles.tile, isSelected && styles.tileSelected]}
                onPress={() => onSelectSubject(sub.code, sub.name)}
              >
                <Text style={[styles.code, isSelected && styles.codeSelected]}>{sub.code}</Text>
                <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: '48%',
    flex: 1,
  },
  tileSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  code: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 2,
  },
  codeSelected: {
    color: '#7C3AED',
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  nameSelected: {
    color: '#5B21B6',
    fontWeight: '700',
  },
});
