export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  usn?: string;
  college?: string;
  collegeCode?: string;
  branch?: string;
  branchCode?: string;
  semester?: number;
  scheme?: string;
  schemeYear?: string;
  phone?: string;
  dob?: string;
  isOnboarded?: boolean;
  avatarUrl?: string;
  currentCgpa?: number;
  targetCgpa?: number;
  totalCredits?: number;
  earnedCredits?: number;
  collegeCity?: string;
  notificationsEnabled?: boolean;
}


export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  usn?: string;
  branch?: string;
  branchCode?: string;
  scheme?: string;
  schemeYear?: string;
}

export interface GoogleLoginPayload {
  idToken: string;
}

export interface OnboardingPayload {
  usn: string;
  collegeCode: string;
  branchCode: string;
  schemeYear: string;
  semester: number;
  phone?: string;
  dob?: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string;
    isOnboarded?: boolean;
    usn?: string;
    collegeCode?: string;
    branchCode?: string;
    schemeYear?: string;
    semester?: number;
    phone?: string;
    dob?: string;
    studentProfile?: {
      usn?: string;
      semester?: number;
      branch?: { code?: string };
      scheme?: { schemeYear?: string };
    };
  };
}
