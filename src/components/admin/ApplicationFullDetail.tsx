import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MapPin, BookOpen, School, Heart, Shield, Users, Home } from "lucide-react";
import LinkedScannedDocuments from "@/components/admin/LinkedScannedDocuments";

interface ParentDetail {
  name?: string;
  occupation?: string;
  nin?: string;
  residence?: string;
  telephone?: string;
  religion?: string;
  tribe?: string;
}

interface GuardianDetail {
  name?: string;
  relationship?: string;
  occupation?: string;
  nin?: string;
  residence?: string;
  placeOfWork?: string;
  contact?: string;
}

interface NextOfKin {
  name?: string;
  residence?: string;
  relationship?: string;
  telephone?: string;
}

interface NearbyRelative {
  name?: string;
  address?: string;
  contact?: string;
}

interface NearestNeighbor {
  name?: string;
  contacts?: string;
}

interface AcademicResults {
  pleYear?: string;
  pleIndex?: string;
  pleAggregates?: string;
  pleGrade?: string;
  pleEnglish?: string;
  pleMath?: string;
  pleSst?: string;
  pleScience?: string;
  uceYear?: string;
  uceIndex?: string;
  uceGrade?: string;
  uaceYear?: string;
  uaceIndex?: string;
  uacePoints?: string;
  uaceCombination?: string;
}

interface SubjectGrade {
  name?: string;
  grade?: string;
}

interface PreviousSchools {
  primaryPle?: string;
  secondaryUce?: string;
  secondaryUace?: string;
  universityInstitute?: string;
}

export interface FullApplication {
  id: string;
  user_id: string;
  student_name: string;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  religion: string | null;
  tribe: string | null;
  nin: string | null;
  passport_photo_url: string | null;
  education_level: string;
  class_grade: string | null;
  subject_combination: string | null;
  course_program: string | null;
  previous_schools: PreviousSchools | null;
  academic_results: AcademicResults | null;
  subject_grades: SubjectGrade[] | null;
  district: string | null;
  sub_county: string | null;
  parish: string | null;
  village: string | null;
  lci_chairperson: string | null;
  lci_contact: string | null;
  orphan_status: string | null;
  deceased_parent: string | null;
  physical_defect: boolean | null;
  physical_defect_details: string | null;
  chronic_disease: boolean | null;
  chronic_disease_details: string | null;
  father_details: ParentDetail | null;
  mother_details: ParentDetail | null;
  who_pays_fees: string | null;
  guardian_details: GuardianDetail | null;
  next_of_kin: NextOfKin | null;
  nearby_relative: NearbyRelative | null;
  nearest_neighbor: NearestNeighbor | null;
  previous_fees_amount: number | null;
  affordable_fees_amount: number | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  relationship: string | null;
  current_school: string | null;
  school_id: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  registration_number: string | null;
  reason: string | null;
  declaration_consent: boolean | null;
  declaration_date: string | null;
}

const levelLabels: Record<string, string> = {
  nursery: "ECD (Nursery)", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="text-sm">
    <span className="text-muted-foreground">{label}:</span>{" "}
    <span className="font-medium">{value || "—"}</span>
  </div>
);

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

interface Props {
  app: FullApplication;
  schoolName?: string;
}

const ApplicationFullDetail = ({ app, schoolName }: Props) => {
  const father = (app.father_details || {}) as ParentDetail;
  const mother = (app.mother_details || {}) as ParentDetail;
  const guardian = (app.guardian_details || {}) as GuardianDetail;
  const kin = (app.next_of_kin || {}) as NextOfKin;
  const relative = (app.nearby_relative || {}) as NearbyRelative;
  const neighbor = (app.nearest_neighbor || {}) as NearestNeighbor;
  const academic = (app.academic_results || {}) as AcademicResults;
  const prevSchools = (app.previous_schools || {}) as PreviousSchools;
  const grades = (app.subject_grades || []) as SubjectGrade[];

  const dob = app.date_of_birth ? new Date(app.date_of_birth) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  return (
    <div className="space-y-5">
      {/* 1. Student Particulars */}
      <div>
        <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
          <User size={16} /> 1. Student Particulars
        </h4>
        <div className="flex items-start gap-4 mb-3">
          {app.passport_photo_url ? (
            <img src={app.passport_photo_url} alt="" className="h-20 w-16 rounded object-cover border-2 border-primary/20" />
          ) : (
            <div className="h-20 w-16 rounded bg-muted flex items-center justify-center text-muted-foreground border">
              <User size={20} />
            </div>
          )}
          <div className="flex-1">
            <p className="font-bold text-foreground text-lg">{app.student_name}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline">{levelLabels[app.education_level] || app.education_level}</Badge>
              {app.class_grade && <Badge variant="secondary">Class {app.class_grade}</Badge>}
              <Badge className="capitalize">{app.status}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Row label="Date of Birth" value={dob ? dob.toLocaleDateString() : null} />
          <Row label="Age" value={age !== null ? `${age} years` : null} />
          <Row label="Sex" value={app.gender} />
          <Row label="Religion" value={app.religion} />
          <Row label="Nationality" value={app.nationality} />
          <Row label="Tribe" value={app.tribe} />
          <Row label="NIN" value={app.nin} />
          {app.subject_combination && <Row label="Subject Combination" value={app.subject_combination} />}
          {app.course_program && <Row label="Course/Program" value={app.course_program} />}
        </div>
      </div>

      {/* Previous Schools */}
      {(prevSchools.primaryPle || prevSchools.secondaryUce || prevSchools.secondaryUace || prevSchools.universityInstitute) && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
              <School size={16} /> Previous Schools
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {prevSchools.primaryPle && <Row label="Primary (PLE)" value={prevSchools.primaryPle} />}
              {prevSchools.secondaryUce && <Row label="Secondary (UCE)" value={prevSchools.secondaryUce} />}
              {prevSchools.secondaryUace && <Row label="Secondary (UACE)" value={prevSchools.secondaryUace} />}
              {prevSchools.universityInstitute && <Row label="University/Institute" value={prevSchools.universityInstitute} />}
            </div>
          </div>
        </>
      )}

      {/* Academic Results */}
      {(academic.pleYear || academic.uceYear || academic.uaceYear) && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Academic Results
            </h4>
            {academic.pleYear && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">PLE</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  <Row label="Year" value={academic.pleYear} />
                  <Row label="Index" value={academic.pleIndex} />
                  <Row label="Aggregates" value={academic.pleAggregates} />
                  <Row label="Grade" value={academic.pleGrade} />
                </div>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  <Row label="English" value={academic.pleEnglish} />
                  <Row label="Math" value={academic.pleMath} />
                  <Row label="SST" value={academic.pleSst} />
                  <Row label="Science" value={academic.pleScience} />
                </div>
              </div>
            )}
            {academic.uceYear && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">UCE</p>
                <div className="grid grid-cols-3 gap-1">
                  <Row label="Year" value={academic.uceYear} />
                  <Row label="Index" value={academic.uceIndex} />
                  <Row label="Grade" value={academic.uceGrade} />
                </div>
              </div>
            )}
            {academic.uaceYear && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-1">UACE</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  <Row label="Year" value={academic.uaceYear} />
                  <Row label="Index" value={academic.uaceIndex} />
                  <Row label="Points" value={academic.uacePoints} />
                  <Row label="Combination" value={academic.uaceCombination} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Subject Grades */}
      {grades.length > 0 && grades.some(g => g.grade) && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm text-primary mb-2">Subject Grades</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {grades.filter(g => g.grade).map((g, i) => (
                <Row key={i} label={g.name || `Subject ${i + 1}`} value={g.grade} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Home Location */}
      <Separator />
      <div>
        <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
          <MapPin size={16} /> Home Location
        </h4>
        <div className="grid grid-cols-2 gap-1">
          <Row label="District" value={app.district} />
          <Row label="Sub-County" value={app.sub_county} />
          <Row label="Parish" value={app.parish} />
          <Row label="Village" value={app.village} />
          <Row label="LCI Chairperson" value={app.lci_chairperson} />
          <Row label="LCI Contact" value={app.lci_contact} />
        </div>
      </div>

      {/* Health & Vulnerability */}
      <Separator />
      <div>
        <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
          <Heart size={16} /> Health & Vulnerability
        </h4>
        <div className="grid grid-cols-2 gap-1">
          <Row label="Orphan" value={app.orphan_status === "yes" ? "Yes" : "No"} />
          {app.orphan_status === "yes" && <Row label="Deceased Parent" value={app.deceased_parent} />}
          <Row label="Physical Defect" value={app.physical_defect ? "Yes" : "No"} />
          {app.physical_defect && <Row label="Details" value={app.physical_defect_details} />}
          <Row label="Chronic Disease" value={app.chronic_disease ? "Yes" : "No"} />
          {app.chronic_disease && <Row label="Details" value={app.chronic_disease_details} />}
        </div>
      </div>

      {/* Parent Details */}
      <Separator />
      <div>
        <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
          <Users size={16} /> 2. Parent / Guardian Particulars
        </h4>
        {(father.name || mother.name) && (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border text-muted-foreground font-medium"></th>
                  <th className="text-left p-2 border text-muted-foreground font-medium">Father</th>
                  <th className="text-left p-2 border text-muted-foreground font-medium">Mother</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Name", father.name, mother.name],
                  ["Occupation", father.occupation, mother.occupation],
                  ["NIN", father.nin, mother.nin],
                  ["Residence", father.residence, mother.residence],
                  ["Telephone", father.telephone, mother.telephone],
                  ["Religion", father.religion, mother.religion],
                  ["Tribe", father.tribe, mother.tribe],
                ].map(([label, fVal, mVal], i) => (
                  (fVal || mVal) ? (
                    <tr key={i}>
                      <td className="p-2 border font-medium text-muted-foreground">{label}</td>
                      <td className="p-2 border">{fVal || "—"}</td>
                      <td className="p-2 border">{mVal || "—"}</td>
                    </tr>
                  ) : null
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Row label="Who pays fees" value={app.who_pays_fees} />

        {guardian.name && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Guardian</p>
            <div className="grid grid-cols-2 gap-1">
              <Row label="Name" value={guardian.name} />
              <Row label="Relationship" value={guardian.relationship} />
              <Row label="Occupation" value={guardian.occupation} />
              <Row label="NIN" value={guardian.nin} />
              <Row label="Residence" value={guardian.residence} />
              <Row label="Place of Work" value={guardian.placeOfWork} />
              <Row label="Contact" value={guardian.contact} />
            </div>
          </div>
        )}

        {kin.name && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Next of Kin</p>
            <div className="grid grid-cols-2 gap-1">
              <Row label="Name" value={kin.name} />
              <Row label="Relationship" value={kin.relationship} />
              <Row label="Residence" value={kin.residence} />
              <Row label="Telephone" value={kin.telephone} />
            </div>
          </div>
        )}

        {relative.name && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Nearby Relative</p>
            <div className="grid grid-cols-2 gap-1">
              <Row label="Name" value={relative.name} />
              <Row label="Address" value={relative.address} />
              <Row label="Contact" value={relative.contact} />
            </div>
          </div>
        )}

        {neighbor.name && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Nearest Neighbor</p>
            <div className="grid grid-cols-2 gap-1">
              <Row label="Name" value={neighbor.name} />
              <Row label="Contacts" value={neighbor.contacts} />
            </div>
          </div>
        )}
      </div>

      {/* Financial */}
      {(app.previous_fees_amount || app.affordable_fees_amount) && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
              <Shield size={16} /> 3. Financial Information
            </h4>
            <div className="grid grid-cols-2 gap-1">
              <Row label="Previous Fees Paid" value={app.previous_fees_amount ? formatUGX(app.previous_fees_amount) : null} />
              <Row label="Can Afford" value={app.affordable_fees_amount ? formatUGX(app.affordable_fees_amount) : null} />
            </div>
          </div>
        </>
      )}

      {/* Assigned School */}
      {schoolName && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
              <Home size={16} /> Assigned School
            </h4>
            <Row label="School" value={schoolName} />
          </div>
        </>
      )}

      {/* Reason */}
      {app.reason && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Reason for Support</p>
            <p className="text-sm bg-muted/50 p-3 rounded-md">{app.reason}</p>
          </div>
        </>
      )}

      {/* Admin Notes */}
      {app.admin_notes && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Admin Notes</p>
            <p className="text-sm bg-muted/50 p-3 rounded-md">{app.admin_notes}</p>
          </div>
        </>
      )}

      {/* Linked Scanned Documents */}
      <Separator />
      <LinkedScannedDocuments applicationId={app.id} />

      <div className="text-xs text-muted-foreground pt-2 border-t">
        Applied: {new Date(app.created_at).toLocaleDateString()} · ID: {app.id.slice(0, 8)}…
      </div>
    </div>
  );
};

export default ApplicationFullDetail;
