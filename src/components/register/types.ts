export type EducationLevel = "nursery" | "primary" | "secondary_o" | "secondary_a" | "vocational" | "university";

export interface ApplicationForm {
  // Step 1: Applicant info
  studentName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  nin: string;
  passportPhotoUrl: string;
  district: string;
  subCounty: string;

  // Step 2: Education level
  educationLevel: EducationLevel | "";

  // Step 3: School info
  schoolId: string;
  currentSchool: string;
  schoolType: string;
  classGrade: string;
  reportCardUrl: string;
  unebIndexNumber: string;
  institutionName: string;
  courseProgram: string;
  yearOfStudy: string;
  registrationNumber: string;
  admissionLetterUrl: string;
  transcriptUrl: string;
  expectedGraduationYear: string;

  // Step 4: Parent/guardian
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
  parentOccupation: string;
  parentMonthlyIncome: string;
  parentNin: string;
  childrenInSchool: number;

  // Step 5: Financial need
  currentFeePayer: string;
  feesPerTerm: number;
  outstandingBalances: number;
  previousBursary: boolean;
  householdIncomeRange: string;
  proofOfNeedUrl: string;

  // Step 6: Personal statement
  personalStatement: string;
  reason: string;

  // Step 7: Vulnerability
  vulnerabilityIndicators: string[];

  // Step 8: Documents
  birthCertificateUrl: string;
  parentIdUrl: string;

  // Step 9: Declaration
  declarationConsent: boolean;
  declarationDate: string;
}

export const initialForm: ApplicationForm = {
  studentName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "Ugandan",
  nin: "",
  passportPhotoUrl: "",
  district: "",
  subCounty: "",
  educationLevel: "",
  schoolId: "",
  currentSchool: "",
  schoolType: "",
  classGrade: "",
  reportCardUrl: "",
  unebIndexNumber: "",
  institutionName: "",
  courseProgram: "",
  yearOfStudy: "",
  registrationNumber: "",
  admissionLetterUrl: "",
  transcriptUrl: "",
  expectedGraduationYear: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  relationship: "parent",
  parentOccupation: "",
  parentMonthlyIncome: "",
  parentNin: "",
  childrenInSchool: 1,
  currentFeePayer: "",
  feesPerTerm: 0,
  outstandingBalances: 0,
  previousBursary: false,
  householdIncomeRange: "",
  proofOfNeedUrl: "",
  personalStatement: "",
  reason: "",
  vulnerabilityIndicators: [],
  birthCertificateUrl: "",
  parentIdUrl: "",
  declarationConsent: false,
  declarationDate: "",
};

export interface SchoolRow {
  id: string;
  name: string;
  level: string;
  district: string;
  requirements: string | null;
  full_fees: number;
  nyunga_covered_fees: number;
  parent_pays: number;
  boarding_available: boolean | null;
}

export const levelLabels: Record<string, string> = {
  nursery: "ECD (Nursery)",
  primary: "Primary",
  secondary_o: "Secondary (O-Level)",
  secondary_a: "Secondary (A-Level)",
  vocational: "Vocational / Technical",
  university: "University / Tertiary",
};

export const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);
