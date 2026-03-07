import { forwardRef } from "react";
import { ApplicationForm } from "./types";
import nyungaLogo from "@/assets/nyunga-official-logo.png";

interface PrintableApplicationFormProps {
  form: ApplicationForm;
  applicationId?: string;
  passportPhotoUrl?: string;
}

const dotLine = (width = "100%") => (
  <span
    style={{
      display: "inline-block",
      width,
      borderBottom: "1px dotted #1a2456",
      minWidth: "40px",
    }}
  />
);

const val = (value: string | number | undefined | null, width = "auto") => (
  <span
    style={{
      display: "inline-block",
      borderBottom: "1px dotted #1a2456",
      minWidth: "40px",
      width,
      textAlign: "center",
      fontWeight: 500,
    }}
  >
    {value || ""}
  </span>
);

const checkbox = (checked: boolean) => (
  <span
    style={{
      display: "inline-block",
      width: "16px",
      height: "16px",
      border: "1.5px solid #1a2456",
      marginLeft: "4px",
      marginRight: "4px",
      verticalAlign: "middle",
      textAlign: "center",
      lineHeight: "14px",
      fontSize: "12px",
    }}
  >
    {checked ? "✓" : ""}
  </span>
);

const PrintableApplicationForm = forwardRef<HTMLDivElement, PrintableApplicationFormProps>(
  ({ form, applicationId, passportPhotoUrl }, ref) => {
    const pageStyle: React.CSSProperties = {
      width: "210mm",
      minHeight: "297mm",
      padding: "12mm 15mm",
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: "11pt",
      color: "#1a2456",
      backgroundColor: "white",
      lineHeight: 1.6,
      position: "relative",
      pageBreakAfter: "always",
    };

    const sectionTitle: React.CSSProperties = {
      fontWeight: "bold",
      fontSize: "11pt",
      marginTop: "8px",
      marginBottom: "4px",
    };

    const tableCell: React.CSSProperties = {
      border: "1.5px solid #1a2456",
      padding: "4px 8px",
      textAlign: "center",
      fontSize: "10pt",
    };

    const tableCellHeader: React.CSSProperties = {
      ...tableCell,
      fontWeight: "bold",
      backgroundColor: "#f0f0f8",
    };

    const motto: React.CSSProperties = {
      fontFamily: "'Georgia', serif",
      fontStyle: "italic",
      fontWeight: "bold",
      color: "#1a2456",
      fontSize: "14pt",
    };

    const pageNum: React.CSSProperties = {
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "11pt",
      marginTop: "8px",
    };

    const dob = form.dateOfBirth ? new Date(form.dateOfBirth) : null;
    const age = dob
      ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : "";

    return (
      <div ref={ref} style={{ background: "white" }}>
        {/* ========== PAGE 1 ========== */}
        <div style={pageStyle}>
          {/* Header with logo */}
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ width: "100px" }}>
              <img src={nyungaLogo} alt="Nyunga Foundation" style={{ width: "90px" }} />
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <h1 style={{ fontSize: "18pt", fontWeight: "bold", margin: 0, letterSpacing: "1px" }}>
                BURSARY APPLICATION FORM
              </h1>
            </div>
            <div style={{ width: "100px" }} />
          </div>

          {/* Photo boxes and date */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ border: "1.5px solid #1a2456", width: "90px", height: "100px", textAlign: "center", fontSize: "8pt", padding: "2px" }}>
              <div style={{ fontWeight: "bold", fontSize: "7pt" }}>PARENT'S PHOTO</div>
              {form.parentIdUrl && (
                <img src={form.parentIdUrl} alt="" style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "cover" }} />
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
                <thead>
                  <tr>
                    <td style={tableCellHeader}>DATE</td>
                    <td style={tableCellHeader}>MONTH</td>
                    <td style={tableCellHeader}>YEAR</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ ...tableCell, width: "50px" }}>{dob ? dob.getDate() : ""}</td>
                    <td style={{ ...tableCell, width: "50px" }}>{dob ? dob.getMonth() + 1 : ""}</td>
                    <td style={{ ...tableCell, width: "50px" }}>{dob ? dob.getFullYear() : ""}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "4px", fontSize: "10pt" }}>
                STUDENT'S APPLICATION NO. {val(applicationId || "", "120px")}
              </div>
            </div>

            <div style={{ border: "1.5px solid #1a2456", width: "90px", height: "100px", textAlign: "center", fontSize: "8pt", padding: "2px" }}>
              <div style={{ fontWeight: "bold", fontSize: "7pt" }}>STUDENT'S PHOTO</div>
              {passportPhotoUrl && (
                <img src={passportPhotoUrl} alt="" style={{ maxWidth: "80px", maxHeight: "80px", objectFit: "cover" }} />
              )}
            </div>
          </div>

          <p style={{ fontStyle: "italic", fontSize: "9.5pt", marginBottom: "10px", borderTop: "1px solid #1a2456", paddingTop: "4px" }}>
            <strong>This form is filled by applicants requesting for a bursary; it costs a non-refundable fee of UGX 50,000
            for primary & secondary and UGX 90,000 for University and Higher Institutions.</strong>
          </p>

          {/* Section 1 */}
          <div style={sectionTitle}>1. PARTICULARS OF APPLICANT (STUDENT).</div>
          <div style={{ paddingLeft: "12px" }}>
            <p><strong>a) Name</strong></p>
            <p>{val(form.studentName, "100%")}</p>

            <p>
              Date of Birth {val(form.dateOfBirth, "100px")}
              ......Sex {val(form.gender, "60px")}
              ......Age {val(String(age), "40px")}
              ......Religion {val(form.religion, "100px")}
            </p>
            <p>
              Nationality {val(form.nationality, "160px")}
              ......Tribe {val(form.tribe, "160px")}
            </p>
            <p>
              Class or Level applied for {val(form.classGrade || form.educationLevel, "150px")}
              {" "}Subject combination (If A level) {val(form.subjectCombination, "120px")}
            </p>
            <p>
              Course (University & Higher Institution) {val(form.courseProgram, "100%")}
            </p>

            <p style={{ marginTop: "8px" }}><strong>b) Previous school(s) attended</strong></p>
            <p style={{ paddingLeft: "16px" }}>
              (i) &nbsp;&nbsp;PRIMARY for (PLE) {val(form.previousSchools.primaryPle, "100%")}
            </p>
            <p style={{ paddingLeft: "16px" }}>
              (ii) &nbsp;SECONDARY (UCE) {val(form.previousSchools.secondaryUce, "100%")}
            </p>
            <p style={{ paddingLeft: "16px" }}>
              (iii) SECONDARY (UACE) {val(form.previousSchools.secondaryUace, "100%")}
            </p>
            <p style={{ paddingLeft: "16px" }}>
              (iv) UNIVERSITY / INSTITUTE {val(form.previousSchools.universityInstitute, "100%")}
            </p>

            <p style={{ marginTop: "8px" }}><strong>c) Academic Details: When Did You sit for:</strong></p>
            <p style={{ paddingLeft: "16px" }}>
              <strong>(i) Primary Leaving Examination (For S.1, S.2, S.3 & S.4 Entrants)</strong>
            </p>
            <p style={{ paddingLeft: "24px" }}>
              Year {val(form.academicResults.pleYear, "70px")}
              ......Index Number: {val(form.academicResults.pleIndex, "90px")}
              {" "}Aggregates {val(form.academicResults.pleAggregates, "50px")}
              ......Grade {val(form.academicResults.pleGrade, "50px")}
            </p>
            <p style={{ paddingLeft: "24px" }}>
              Results: English {val(form.academicResults.pleEnglish, "50px")}
              ......Math {val(form.academicResults.pleMath, "50px")}
              ......SST {val(form.academicResults.pleSst, "50px")}
              ......Science {val(form.academicResults.pleScience, "50px")}
            </p>

            <p style={{ paddingLeft: "16px", marginTop: "6px" }}>
              <strong>(ii) Uganda Certificate of Education (UCE).</strong>
            </p>
            <p style={{ paddingLeft: "24px" }}>
              Year: {val(form.academicResults.uceYear, "70px")}
              ......Index No: {val(form.academicResults.uceIndex, "120px")}
              {" "}Grade: {val(form.academicResults.uceGrade, "80px")}
            </p>

            <p style={{ paddingLeft: "16px", marginTop: "6px" }}>
              <strong>(iii) Uganda Advanced Certificate of Education (UACE).</strong>
            </p>
            <p style={{ paddingLeft: "24px" }}>
              Year: {val(form.academicResults.uaceYear, "70px")}
              ......Index No: {val(form.academicResults.uaceIndex, "90px")}
              {" "}Points: {val(form.academicResults.uacePoints, "50px")}
              {" "}Combination: {val(form.academicResults.uaceCombination, "90px")}
            </p>
          </div>

          <div style={pageNum}>1</div>
        </div>

        {/* ========== PAGE 2 ========== */}
        <div style={pageStyle}>
          <div style={sectionTitle}>Results. (State Subject and Grade)</div>

          <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "10px" }}>
            <thead>
              <tr>
                <td style={tableCellHeader}>Subjects Name</td>
                <td style={tableCellHeader}>GRADE</td>
                <td style={tableCellHeader}>Subject Name</td>
                <td style={tableCellHeader}>Grade</td>
                <td style={tableCellHeader}>Other Optional Subjects Name</td>
                <td style={tableCellHeader}>Grade</td>
              </tr>
            </thead>
            <tbody>
              {["Mathematics", "English", "Physics", "Chemistry", "Biology"].map((subj, i) => {
                const g1 = form.subjectGrades.find((s) => s.name === subj);
                const optionalNames = ["Geography", "History", "Commerce"];
                const opt = form.subjectGrades.find((s) => s.name === optionalNames[i]);
                const extra = form.subjectGrades.filter(
                  (s) => !["Mathematics", "English", "Physics", "Chemistry", "Biology", "Geography", "History", "Commerce"].includes(s.name)
                );
                const ex = extra[i];
                return (
                  <tr key={i}>
                    <td style={tableCell}>{subj}</td>
                    <td style={tableCell}>{g1?.grade || ""}</td>
                    <td style={tableCell}>{optionalNames[i] || ""}</td>
                    <td style={tableCell}>{opt?.grade || ""}</td>
                    <td style={tableCell}>{ex?.name || ""}</td>
                    <td style={tableCell}>{ex?.grade || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={sectionTitle}>d) HOME LOCATION :</div>
          <p>
            District: {val(form.district, "140px")}
            ......county/division: {val("", "140px")}
            ......village: {val(form.village, "120px")}
          </p>
          <p>
            Parish/ward: {val(form.parish, "140px")}
            ......Sub county: {val(form.subCounty, "160px")}
          </p>
          <p>
            Name of LCI chairperson: {val(form.lciChairperson, "200px")}
            ......contact: {val(form.lciContact, "140px")}
          </p>

          <p style={{ marginTop: "10px" }}>
            e) Are you an orphan? No {checkbox(form.orphanStatus === "no")}
            &nbsp;&nbsp;&nbsp;Yes {checkbox(form.orphanStatus === "yes")}
          </p>
          <p>
            If yes, state who died: Father {checkbox(form.deceasedParent === "father")}
            &nbsp;&nbsp;Mother {checkbox(form.deceasedParent === "mother")}
            &nbsp;&nbsp;Both {checkbox(form.deceasedParent === "both")}
          </p>

          <p style={{ marginTop: "10px" }}>
            Do you have any physical defect/hand cup? Yes {checkbox(form.physicalDefect === true)}
            &nbsp;&nbsp;No {checkbox(form.physicalDefect === false)}
          </p>
          <p>If yes state it: {val(form.physicalDefectDetails, "100%")}</p>

          <p style={{ marginTop: "6px" }}>
            Do you have any chronic disease? Yes {checkbox(form.chronicDisease === true)}
            &nbsp;&nbsp;No {checkbox(form.chronicDisease === false)}
          </p>
          <p>If yes state it: {val(form.chronicDiseaseDetails, "100%")}</p>

          <p style={{ marginTop: "6px" }}>
            If yes, Attach a doctors' report for the two cases above and explain how you contain it:
          </p>
          <p>{val("", "100%")}</p>
          <p>{val("", "100%")}</p>

          <div style={{ position: "absolute", bottom: "20mm", left: "15mm" }}>
            <span style={motto}>"Still there's Hope"</span>
          </div>
          <div style={pageNum}>2</div>
        </div>

        {/* ========== PAGE 3 ========== */}
        <div style={pageStyle}>
          <div style={sectionTitle}>2. PARENT / GUARDIAN PARTICULARS:</div>
          <div style={{ paddingLeft: "12px" }}>
            <p><strong>(a) PARENT</strong></p>

            <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "8px" }}>
              <thead>
                <tr>
                  <td style={tableCellHeader}></td>
                  <td style={tableCellHeader}>FATHER</td>
                  <td style={tableCellHeader}>MOTHER</td>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Name", form.fatherDetails.name, form.motherDetails.name],
                  ["Occupation", form.fatherDetails.occupation, form.motherDetails.occupation],
                  ["National ID Number (NIN)", form.fatherDetails.nin, form.motherDetails.nin],
                  ["Residence", form.fatherDetails.residence, form.motherDetails.residence],
                  ["Telephone number", form.fatherDetails.telephone, form.motherDetails.telephone],
                  ["Religion", form.fatherDetails.religion, form.motherDetails.religion],
                  ["Tribe", form.fatherDetails.tribe, form.motherDetails.tribe],
                ].map(([label, fVal, mVal], i) => (
                  <tr key={i}>
                    <td style={{ ...tableCell, textAlign: "left", fontWeight: "bold" }}>{label}</td>
                    <td style={tableCell}>{fVal}</td>
                    <td style={tableCell}>{mVal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p>
              Who is paying your school fees / requirements?
              &nbsp;&nbsp;Father {checkbox(form.whoPaysFees === "father")}
              &nbsp;&nbsp;Mother {checkbox(form.whoPaysFees === "mother")}
              &nbsp;&nbsp;Both {checkbox(form.whoPaysFees === "both")}
              &nbsp;&nbsp;Guardian {checkbox(form.whoPaysFees === "guardian")}
            </p>

            <p style={{ marginTop: "8px" }}><strong>(b) GUARDIANS' PARTICULARS:</strong></p>
            <p>Name: {val(form.guardianDetails.name, "100%")}</p>
            <p>Relationship with the applicant: {val(form.guardianDetails.relationship, "100%")}</p>
            <p>Occupation: {val(form.guardianDetails.occupation, "100%")}</p>
            <p>His/her National ID No. (NIN) {val(form.guardianDetails.nin, "100%")}</p>
            <p>Residence (village): {val(form.guardianDetails.residence, "60%")} ......place of work: {val(form.guardianDetails.placeOfWork, "30%")}</p>
            <p>contact(s): {val(form.guardianDetails.contact, "100%")}</p>

            <p style={{ marginTop: "8px" }}><strong>(c) Next of Kin:</strong></p>
            <p>Name: {val(form.nextOfKin.name, "60%")} ......relationship with applicant {val(form.nextOfKin.relationship, "30%")}</p>
            <p>Residence: {val(form.nextOfKin.residence, "60%")} ......Tel: {val(form.nextOfKin.telephone, "30%")}</p>

            <p style={{ marginTop: "8px" }}><strong>(d) Name of any relative who lives near the school</strong></p>
            <p>Address (village/town) {val(form.nearbyRelative.address, "100%")}</p>
            <p>Contact: {val(form.nearbyRelative.contact, "100%")}</p>

            <p style={{ marginTop: "6px" }}>
              Name of nearest neighbor at your home: {val(form.nearestNeighbor.name, "100%")}
            </p>
            <p>Contacts: {val(form.nearestNeighbor.contacts, "100%")}</p>
          </div>

          <div style={{ position: "absolute", bottom: "20mm", left: "15mm" }}>
            <span style={motto}>"Still there's Hope"</span>
          </div>
          <div style={pageNum}>3</div>
        </div>

        {/* ========== PAGE 4 ========== */}
        <div style={pageStyle}>
          <div style={sectionTitle}>3. QUALIFICATION FOR FULL OR PARTIAL BURSARY ON TUITION FEES:</div>
          <div style={{ paddingLeft: "12px", fontSize: "10.5pt" }}>
            <p>(a) <strong>S.1:</strong> 4 - 12 aggregates in PLE - Full Bursary &nbsp;| &nbsp;13 - 26 aggregates in PLE - Partial Bursary</p>
            <p>(b) <strong>S.5:</strong> A' Level; - Combination with A's and B's - Full Bursary</p>
            <p style={{ paddingLeft: "40px" }}>- Combination with C's - Partial Bursary</p>
            <p>(c) <strong>S.2, S.3, S.4, S.6</strong> and <strong>Primary classes</strong> will do an interview on which the kind of bursary will depend on the results obtained as given below;</p>
            <p style={{ paddingLeft: "24px" }}>71% - 100% &nbsp;- Full Bursary</p>
            <p style={{ paddingLeft: "24px" }}>36% - 70% &nbsp;- Partial Bursary</p>
            <p>However, Bursaries can still be offered to applicants depending on financial challenges, students' talent(s) or to Orphans</p>
          </div>

          <div style={{ marginTop: "10px", paddingLeft: "12px" }}>
            <p>
              4 (a) How much have you been paying as fees from your previous school or institution?
            </p>
            <p>{val(form.previousFeesAmount ? `UGX ${form.previousFeesAmount.toLocaleString()}` : "", "100%")}</p>

            <p style={{ marginTop: "6px", paddingLeft: "16px" }}>
              (b) Incase you do not get a full bursary, how much can you afford to pay as tuition fees?
            </p>
            <p>{val(form.affordableFeesAmount ? `UGX ${form.affordableFeesAmount.toLocaleString()}` : "", "100%")}</p>
          </div>

          <div style={{ marginTop: "16px" }}>
            <h3 style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "6px" }}>Declaration</h3>
            <p>
              We the undersigned declare and confirm that the information stated above is true and correct to
              the best of our knowledge and that we have agreed to the terms and conditions under this
              application form.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
              <div style={{ width: "48%" }}>
                <p><strong>Student</strong></p>
                <p>Name: {val(form.studentName, "80%")}</p>
                <p>Sign: {val("", "80%")}</p>
                <p>Date: {val(form.declarationDate || "", "80%")}</p>
              </div>
              <div style={{ width: "48%" }}>
                <p><strong>Parent/Guardian</strong></p>
                <p>{val("", "80%")}</p>
                <p>{val("", "80%")}</p>
                <p>{val("", "80%")}</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <h3 style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "8px" }}>FOR OFFICIAL USE ONLY</h3>
            <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
              <tbody>
                <tr>
                  <td style={{ ...tableCell, fontWeight: "bold", width: "100px" }}>ACCEPTED</td>
                  <td style={{ ...tableCell, width: "30px" }}></td>
                  <td style={{ ...tableCell, fontWeight: "bold", width: "60px" }}>FULL</td>
                  <td style={{ ...tableCell, width: "30px" }}></td>
                  <td style={{ ...tableCell, fontWeight: "bold", width: "60px" }}>HALF</td>
                  <td style={{ ...tableCell, width: "30px" }}></td>
                  <td style={{ ...tableCell, fontWeight: "bold", width: "80px" }}>REJECTED</td>
                  <td style={{ ...tableCell, width: "30px" }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "10px" }}>
            <p>Approved by:</p>
            <p>Name: {val("", "100%")}</p>
            <p>Sign: {val("", "100%")}</p>
            <p>Name of the School/ Institution/University {val(form.currentSchool || "", "100%")}</p>
            <p style={{ fontWeight: "bold", marginTop: "4px" }}>REASON FOR THE BURSARY</p>
            <p>{val("", "100%")}</p>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <span style={motto}>"Still there's Hope"</span>
          </div>
          <div style={pageNum}>4</div>
        </div>
      </div>
    );
  }
);

PrintableApplicationForm.displayName = "PrintableApplicationForm";

export default PrintableApplicationForm;
