import { apiClient } from '@/infrastructure/api/client';

export interface AdminSubjectItem {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  type?: string;
  branchCode?: string;
}

// VTU Curriculum fallback for all semesters (NEP 2020 & 2021/2022 Schemes)
export const FALLBACK_VTU_SUBJECTS: Record<number, AdminSubjectItem[]> = {
  1: [
    { id: 'sub-101', code: '21MAT11', name: 'Calculus and Linear Algebra', semester: 1, credits: 4, type: 'Theory' },
    { id: 'sub-102', code: '21PHY12', name: 'Engineering Physics', semester: 1, credits: 4, type: 'Theory' },
    { id: 'sub-103', code: '21ELE13', name: 'Basic Electrical Engineering', semester: 1, credits: 3, type: 'Theory' },
    { id: 'sub-104', code: '21CIV14', name: 'Elements of Civil Engineering', semester: 1, credits: 3, type: 'Theory' },
    { id: 'sub-105', code: '21EVN15', name: 'Environmental Studies', semester: 1, credits: 1, type: 'Theory' },
    { id: 'sub-106', code: '21PHYL16', name: 'Engineering Physics Laboratory', semester: 1, credits: 1, type: 'Lab' },
  ],
  2: [
    { id: 'sub-201', code: '21MAT21', name: 'Advanced Calculus and Numerical Methods', semester: 2, credits: 4, type: 'Theory' },
    { id: 'sub-202', code: '21CHE22', name: 'Engineering Chemistry', semester: 2, credits: 4, type: 'Theory' },
    { id: 'sub-203', code: '21PSP23', name: 'Problem Solving through Programming (C)', semester: 2, credits: 3, type: 'Theory' },
    { id: 'sub-204', code: '21ELN24', name: 'Basic Electronics & Communication', semester: 2, credits: 3, type: 'Theory' },
    { id: 'sub-205', code: '21CPL26', name: 'Computer Programming Laboratory', semester: 2, credits: 1.5, type: 'Lab' },
    { id: 'sub-206', code: '21CHEL27', name: 'Engineering Chemistry Laboratory', semester: 2, credits: 1.5, type: 'Lab' },
  ],
  3: [
    { id: 'sub-301', code: '21MAT31', name: 'Transform Calculus, Fourier Series & Numerical Techniques', semester: 3, credits: 4, type: 'Theory' },
    { id: 'sub-302', code: '21CS32', name: 'Data Structures and Applications', semester: 3, credits: 4, type: 'Theory' },
    { id: 'sub-303', code: '21CS33', name: 'Analog and Digital Electronics', semester: 3, credits: 4, type: 'Theory' },
    { id: 'sub-304', code: '21CS34', name: 'Computer Organization and Architecture', semester: 3, credits: 3, type: 'Theory' },
    { id: 'sub-305', code: '21CSL35', name: 'Data Structures Laboratory', semester: 3, credits: 1.5, type: 'Lab' },
    { id: 'sub-306', code: '21CSL36', name: 'ADE Laboratory', semester: 3, credits: 1.5, type: 'Lab' },
  ],
  4: [
    { id: 'sub-401', code: '21MAT41', name: 'Complex Analysis, Probability and Statistical Methods', semester: 4, credits: 4, type: 'Theory' },
    { id: 'sub-402', code: '21CS42', name: 'Design and Analysis of Algorithms', semester: 4, credits: 4, type: 'Theory' },
    { id: 'sub-403', code: '21CS43', name: 'Microcontrollers and Embedded Systems', semester: 4, credits: 4, type: 'Theory' },
    { id: 'sub-404', code: '21CS44', name: 'Operating Systems', semester: 4, credits: 3, type: 'Theory' },
    { id: 'sub-405', code: '21CSL46', name: 'DAA Laboratory', semester: 4, credits: 1.5, type: 'Lab' },
    { id: 'sub-406', code: '21CSL47', name: 'Microcontroller Laboratory', semester: 4, credits: 1.5, type: 'Lab' },
  ],
  5: [
    { id: 'sub-501', code: '21CS51', name: 'Automata Theory & Computability', semester: 5, credits: 4, type: 'Theory' },
    { id: 'sub-502', code: '21CS52', name: 'Computer Networks', semester: 5, credits: 4, type: 'Theory' },
    { id: 'sub-503', code: '21CS53', name: 'Database Management Systems', semester: 5, credits: 4, type: 'Theory' },
    { id: 'sub-504', code: '21CS54', name: 'Artificial Intelligence & Machine Learning', semester: 5, credits: 3, type: 'Theory' },
    { id: 'sub-505', code: '21RMI56', name: 'Research Methodology & IPR', semester: 5, credits: 3, type: 'Theory' },
    { id: 'sub-506', code: '21CIV57', name: 'Environmental Studies', semester: 5, credits: 1, type: 'Theory' },
    { id: 'sub-507', code: '21CSL55', name: 'DBMS Laboratory with Mini Project', semester: 5, credits: 2, type: 'Lab' },
  ],
  6: [
    { id: 'sub-601', code: '21CS61', name: 'Software Engineering & Project Management', semester: 6, credits: 4, type: 'Theory' },
    { id: 'sub-602', code: '21CS62', name: 'Full Stack Development', semester: 6, credits: 4, type: 'Theory' },
    { id: 'sub-603', code: '21CS63', name: 'Cloud Computing Services', semester: 6, credits: 3, type: 'Theory' },
    { id: 'sub-604', code: '21CS64X', name: 'Professional Elective Course II', semester: 6, credits: 3, type: 'Elective' },
    { id: 'sub-605', code: '21CS65X', name: 'Open Elective Course I', semester: 6, credits: 3, type: 'Elective' },
    { id: 'sub-606', code: '21CSL66', name: 'Full Stack Web Development Lab', semester: 6, credits: 2, type: 'Lab' },
  ],
  7: [
    { id: 'sub-701', code: '21CS71', name: 'Big Data Analytics', semester: 7, credits: 4, type: 'Theory' },
    { id: 'sub-702', code: '21CS72', name: 'Cryptography & Network Security', semester: 7, credits: 4, type: 'Theory' },
    { id: 'sub-703', code: '21CS73X', name: 'Professional Elective Course III', semester: 7, credits: 3, type: 'Elective' },
    { id: 'sub-704', code: '21CS74X', name: 'Open Elective Course II', semester: 7, credits: 3, type: 'Elective' },
    { id: 'sub-705', code: '21CSP75', name: 'Project Work Phase - 1', semester: 7, credits: 2, type: 'Project' },
  ],
  8: [
    { id: 'sub-801', code: '21CS81', name: 'Technical Seminar & Paper Presentation', semester: 8, credits: 2, type: 'Seminar' },
    { id: 'sub-802', code: '21CSP82', name: 'Major Project Work Phase - 2', semester: 8, credits: 8, type: 'Project' },
    { id: 'sub-803', code: '21INT83', name: 'Industry Internship / Research Internship', semester: 8, credits: 4, type: 'Internship' },
  ],
};

/**
 * Fetch subjects added by admin from backend database, filtered by semester
 */
export const fetchAdminCoursesFromApi = async (
  semesterNumber: number = 5,
  branchCode?: string
): Promise<AdminSubjectItem[]> => {
  try {
    const response = await apiClient.get<any[]>('/academics/courses');
    const courses = response?.data || response;

    if (Array.isArray(courses) && courses.length > 0) {
      // Filter by semester number
      const filtered = courses.filter((c: any) => {
        const semNum = c.semester?.number || c.semesterNumber || (c.semesterId ? parseInt(c.semesterId, 10) : null);
        const matchesSem = semNum ? semNum === semesterNumber : true;

        if (branchCode && c.branch?.code) {
          return matchesSem && c.branch.code.toUpperCase() === branchCode.toUpperCase();
        }
        return matchesSem;
      });

      if (filtered.length > 0) {
        return filtered.map((c: any) => ({
          id: String(c.id),
          code: c.subjectCode || c.code,
          name: c.title || c.name,
          semester: c.semester?.number || semesterNumber,
          credits: c.credits ? Number(c.credits) : 4,
          type: c.courseType?.name || (c.subjectCode?.includes('L') ? 'Lab' : 'Theory'),
          branchCode: c.branch?.code || branchCode,
        }));
      }
    }
  } catch (err) {
    console.warn('[attendanceApi] Could not fetch courses from backend, falling back to VTU syllabus:', err);
  }

  // Fallback to accredited VTU curriculum for the semester
  return FALLBACK_VTU_SUBJECTS[semesterNumber] || FALLBACK_VTU_SUBJECTS[5];
};
