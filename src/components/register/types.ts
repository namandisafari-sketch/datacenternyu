export type EducationLevel = "nursery" | "primary" | "secondary_o" | "secondary_a" | "vocational" | "university";

export interface ParentDetail {
  name: string;
  occupation: string;
  nin: string;
  residence: string;
  telephone: string;
  religion: string;
  tribe: string;
}

export interface GuardianDetail {
  name: string;
  relationship: string;
  occupation: string;
  nin: string;
  residence: string;
  placeOfWork: string;
  contact: string;
}

export interface NextOfKin {
  name: string;
  residence: string;
  relationship: string;
  telephone: string;
}

export interface NearbyRelative {
  name: string;
  address: string;
  contact: string;
}

export interface NearestNeighbor {
  name: string;
  contacts: string;
}

export interface AcademicResults {
  pleYear: string;
  pleIndex: string;
  pleAggregates: string;
  pleGrade: string;
  pleEnglish: string;
  pleMath: string;
  pleSst: string;
  pleScience: string;
  uceYear: string;
  uceIndex: string;
  uceGrade: string;
  uaceYear: string;
  uaceIndex: string;
  uacePoints: string;
  uaceCombination: string;
}

export interface SubjectGrade {
  name: string;
  grade: string;
}

export interface PreviousSchools {
  primaryPle: string;
  secondaryUce: string;
  secondaryUace: string;
  universityInstitute: string;
}

export interface ApplicationForm {
  // Step 1: Student Particulars
  studentName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  religion: string;
  tribe: string;
  nin: string;
  passportPhotoUrl: string;
  educationLevel: EducationLevel | "";
  classGrade: string;
  subjectCombination: string;
  courseProgram: string;
  previousSchools: PreviousSchools;
  academicResults: AcademicResults;

  // Step 2: Results, Home Location & Health
  subjectGrades: SubjectGrade[];
  district: string;
  subCounty: string;
  parish: string;
  village: string;
  lciChairperson: string;
  lciContact: string;
  orphanStatus: string;
  deceasedParent: string;
  physicalDefect: boolean;
  physicalDefectDetails: string;
  chronicDisease: boolean;
  chronicDiseaseDetails: string;

  // Step 3: Parent/Guardian Particulars
  fatherDetails: ParentDetail;
  motherDetails: ParentDetail;
  whoPaysFees: string;
  guardianDetails: GuardianDetail;
  nextOfKin: NextOfKin;
  nearbyRelative: NearbyRelative;
  nearestNeighbor: NearestNeighbor;

  // Step 4: Qualification, Financial & Declaration
  previousFeesAmount: number;
  affordableFeesAmount: number;
  declarationConsent: boolean;
  declarationDate: string;

  // Legacy fields kept for compatibility
  schoolId: string;
  currentSchool: string;
  schoolType: string;
  reportCardUrl: string;
  unebIndexNumber: string;
  institutionName: string;
  yearOfStudy: string;
  registrationNumber: string;
  admissionLetterUrl: string;
  transcriptUrl: string;
  expectedGraduationYear: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
  parentOccupation: string;
  parentMonthlyIncome: string;
  parentNin: string;
  childrenInSchool: number;
  currentFeePayer: string;
  feesPerTerm: number;
  outstandingBalances: number;
  previousBursary: boolean;
  householdIncomeRange: string;
  proofOfNeedUrl: string;
  personalStatement: string;
  reason: string;
  vulnerabilityIndicators: string[];
  birthCertificateUrl: string;
  parentIdUrl: string;
}

const emptyParentDetail = (): ParentDetail => ({
  name: "", occupation: "", nin: "", residence: "", telephone: "", religion: "", tribe: "",
});

const emptyGuardianDetail = (): GuardianDetail => ({
  name: "", relationship: "", occupation: "", nin: "", residence: "", placeOfWork: "", contact: "",
});

const emptyNextOfKin = (): NextOfKin => ({
  name: "", residence: "", relationship: "", telephone: "",
});

const emptyAcademicResults = (): AcademicResults => ({
  pleYear: "", pleIndex: "", pleAggregates: "", pleGrade: "",
  pleEnglish: "", pleMath: "", pleSst: "", pleScience: "",
  uceYear: "", uceIndex: "", uceGrade: "",
  uaceYear: "", uaceIndex: "", uacePoints: "", uaceCombination: "",
});

export const initialForm: ApplicationForm = {
  studentName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "Ugandan",
  religion: "",
  tribe: "",
  nin: "",
  passportPhotoUrl: "",
  educationLevel: "",
  classGrade: "",
  subjectCombination: "",
  courseProgram: "",
  previousSchools: { primaryPle: "", secondaryUce: "", secondaryUace: "", universityInstitute: "" },
  academicResults: emptyAcademicResults(),

  subjectGrades: [
    { name: "Mathematics", grade: "" },
    { name: "English", grade: "" },
    { name: "Physics", grade: "" },
    { name: "Chemistry", grade: "" },
    { name: "Biology", grade: "" },
    { name: "Geography", grade: "" },
    { name: "History", grade: "" },
    { name: "Commerce", grade: "" },
  ],
  district: "",
  subCounty: "",
  parish: "",
  village: "",
  lciChairperson: "",
  lciContact: "",
  orphanStatus: "no",
  deceasedParent: "",
  physicalDefect: false,
  physicalDefectDetails: "",
  chronicDisease: false,
  chronicDiseaseDetails: "",

  fatherDetails: emptyParentDetail(),
  motherDetails: emptyParentDetail(),
  whoPaysFees: "",
  guardianDetails: emptyGuardianDetail(),
  nextOfKin: emptyNextOfKin(),
  nearbyRelative: { name: "", address: "", contact: "" },
  nearestNeighbor: { name: "", contacts: "" },

  previousFeesAmount: 0,
  affordableFeesAmount: 0,
  declarationConsent: false,
  declarationDate: "",

  // Legacy
  schoolId: "",
  currentSchool: "",
  schoolType: "",
  reportCardUrl: "",
  unebIndexNumber: "",
  institutionName: "",
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
