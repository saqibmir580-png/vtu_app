import { apiClient } from '../../../infrastructure/api/client';

export interface AcademicScheme {
  id: string;
  schemeYear: string;
  name: string;
}

export interface EngineeringBranch {
  id: string;
  code: string;
  name: string;
}

export interface SemesterMaster {
  id: string;
  number: number;
}

export interface VTUCollege {
  id: string;
  code: string;
  name: string;
  region: string;
}

const extractArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

export const fetchAcademicSchemes = async (): Promise<AcademicScheme[]> => {
  try {
    const res: any = await apiClient.get('/academics/schemes');
    return extractArray(res);
  } catch {
    return [
      { id: '2022', schemeYear: '2022', name: '2022 NEP Scheme' },
      { id: '2021', schemeYear: '2021', name: '2021 Scheme' },
      { id: '2018', schemeYear: '2018', name: '2018 CBCS Scheme' },
    ];
  }
};

export const fetchEngineeringBranches = async (): Promise<EngineeringBranch[]> => {
  try {
    const res: any = await apiClient.get('/academics/branches');
    return extractArray(res);
  } catch {
    return [
      { id: 'cse', code: 'CSE', name: 'Computer Science & Engineering' },
      { id: 'ece', code: 'ECE', name: 'Electronics & Communication' },
      { id: 'ise', code: 'ISE', name: 'Information Science & Engineering' },
      { id: 'aiml', code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
      { id: 'me', code: 'ME', name: 'Mechanical Engineering' },
      { id: 'cv', code: 'CV', name: 'Civil Engineering' },
    ];
  }
};

export const fetchAcademicSemesters = async (): Promise<SemesterMaster[]> => {
  try {
    const res: any = await apiClient.get('/academics/semesters');
    return extractArray(res);
  } catch {
    return [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: String(n), number: n }));
  }
};

export const fetchVTUColleges = async (): Promise<VTUCollege[]> => {
  try {
    const res: any = await apiClient.get('/academics/colleges');
    return extractArray(res);
  } catch {
    return [
      { id: '1rv', code: '1RV', name: 'RV College of Engineering', region: 'Bengaluru' },
      { id: '1ms', code: '1MS', name: 'BMS College of Engineering', region: 'Bengaluru' },
      { id: '1pe', code: '1PE', name: 'PES Institute of Technology', region: 'Bengaluru' },
      { id: '1bi', code: '1BI', name: 'BMS Institute of Technology', region: 'Bengaluru' },
    ];
  }
};

export const updateStudentProfileApiFunction = async (payload: {
  usn: string;
  collegeCode: string;
  branchCode: string;
  schemeYear: string;
  semester: number;
  targetCgpa?: number;
}): Promise<any> => {
  const res: any = await apiClient.post('/users/student-profile', payload);
  return res.data || res;
};
