
import lawyerStampImg from "@/assets/lawyer-stamp.png";
import lawyerSignatureImg from "@/assets/lawyer-signature.png";
import nyungaLogo from "@/assets/nyunga-official-logo.png";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormTemplate {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  is_active: boolean;
}

interface Props {
  template: FormTemplate;
  responses: Record<string, any>;
  signatureUrl: string | null;
  submittedAt: string;
}

const blank = (val: string | undefined, width = 200) =>
  val
    ? `<span style="border-bottom:1px dotted #000;padding:0 4px;min-width:${width}px;display:inline-block">${val}</span>`
    : `<span style="border-bottom:1px dotted #000;display:inline-block;min-width:${width}px">&nbsp;</span>`;

export const generateEnglishDocumentHTML = (r: Record<string, any>, signatureUrl: string | null, submittedAt: string) => {
  const dateStr = new Date(submittedAt).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" });
  return `
<div style="font-family:'Times New Roman',serif;color:#000;background:#fff;padding:40px 50px;max-width:210mm;margin:0 auto;font-size:12px;line-height:1.6">
  <div style="text-align:center;margin-bottom:10px">
    ${r.application_number ? `<p style="text-align:right;font-size:11px;margin:0 0 6px 0"><strong>Application No:</strong> ${r.application_number}</p>` : ""}
    <p style="font-weight:bold;font-size:14px;margin:4px 0">THE REPUBLIC OF UGANDA</p>
    <p style="font-weight:bold;font-size:13px;margin:4px 0">IN THE MATTER OF THE CONTRACTS ACT CAP 284</p>
    <p style="font-weight:bold;font-size:13px;margin:4px 0">IN THE MATTER OF A MEMORANDUM OF UNDERSTANDING</p>
  </div>

  <p><strong>This agreement</strong> is made on the ${blank(r.agreement_day, 60)} day of ${blank(r.agreement_month, 120)}...202${blank(r.agreement_year, 30)}...</p>

  <p style="text-align:center;font-weight:bold;margin:10px 0">BETWEEN</p>

  <p>${blank(r.school_name, 300)}<strong>(SCHOOL)</strong> in association with <strong>NYUNGA FOUNDATION</strong> located at Katwe, Byandala Building of <strong>Tel 0746960654</strong>(Hereinafter referred to as <strong>"THE FIRST PARTY"</strong>)</p>

  <p style="text-align:center;font-weight:bold;margin:10px 0">AND</p>

  <p>${blank(r.parent_name, 300)}...Parent of ${blank(r.parent_of, 200)} of Tel${blank(r.parent_phone, 120)}, resident of${blank(r.parent_district, 200)} District.<br/>
  <strong>(Hereinafter referred to as the "SECOND PARTY")</strong></p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:16px">RECITALS</p>

  <p><strong>a) WHEREAS NYUNGA FOUNDATION</strong> solicited for full bursaries from the first party to be offered to students who do not have the financial capacity to afford education.</p>

  <p><strong>b) WHEREAS the first party</strong> agreed to offer bursaries to students to enable them to study without paying tuition fees until each student who is offered the said bursary completes studies depending on the education level upon which the said bursary was offered to the student.</p>

  <p style="text-align:center;font-weight:bold;margin:8px 0">AND</p>

  <p><strong>C) WHEN BOTH</strong> parents and students got information about the bursaries offered by <strong>NYUNGA FOUNDATION,</strong> they formally submitted in their requests so that they are considered in regard to the bursaries offered.</p>

  <p style="font-weight:bold;margin-top:16px">NOW THEREFORE THIS AGREEMENT WITNESSETH as follows;</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">1. BURSARIES</p>
  <p style="margin-left:20px">a. The full bursary offered to the student is in regard to the tuition fees met to be paid by the student.</p>
  <p style="margin-left:20px">b. The student is under an obligation to pay the school requirements requested by the school.</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">2. DURATION OF BURSARY.</p>
  <p style="margin-left:20px">a. A student shall study on bursary for a period of${blank(r.bursary_duration, 80)}year/s without changing the school.</p>
  <p style="margin-left:20px">b. In case a parent intends to change a school for a student without a just cause or the parent has got the financial capacity to enable him to pay tuition fees for the student in any school of their choice, the parent is under an obligation to pay tuition fees for a period upon which the student was studying under the offered bursary without fail.</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">3. DUTIES AND OBLIGATIONS OF THE SCHOOL.</p>
  <p style="margin-left:20px">a. The school shall not solicit or collect tuition fees from students who have been offered bursaries until the bursary period elapses.</p>
  <p style="margin-left:20px">b. The school is under an obligation to offer quality education to students to ensure that the student grades improve.</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">4. DUTIES AND OBLIGATIONS OF A PARENT AND A STUDENT.</p>
  <p style="margin-left:20px">a. The parent is under an obligation to pay school requirements for the student as provided for under the admission form provided by the school.</p>
  <p style="margin-left:20px">b. The school requirements in <strong>paragraph 4a</strong> are categorized into two; the termly requirements which are by each student every term and school requirements which are paid once during the admission of the student.</p>
  <p style="margin-left:20px">c. Other than the mandatory school requirements, the parent is under a duty to provide requirements for a student to enable the student in the smooth pursue of his studies. These requirements differ depending on the needs of a particular student.</p>
  <p style="margin-left:20px">d. Both students and parents have a duty to obey to the school rules and regulations without breach of the same.</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">5. BREACH OF A CONTRACT</p>
  <p style="margin-left:20px">In case a student or a parent violates the school rules and regulations, the bursary which has been offer to the student shall be canceled and also the student will be suspended from the school.</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">6. PICKING UP END OF TERM REPORT</p>
  <p style="margin-left:20px">a. It's a policy of Nyunga Foundation that at the end of each a academic term, all students under the arrangement of bursaries, there academic reports of that particular academic term a delivered at the office of Nyunga Foundation with a sole purpose of evaluating the academic performance of students.</p>
  <p style="margin-left:20px">b. There shall be a meeting conducted at Nyunga Foundation office involving both students and parents with a sole purpose of;
    <br/>&nbsp;&nbsp;&nbsp;&nbsp;• Interacting with the students.
    <br/>&nbsp;&nbsp;&nbsp;&nbsp;• Counselling and guiding the students.</p>
  <p style="margin-left:20px">c. Upon concluding the parents, students meeting in paragraph 6b above, the school report for the concluded academic term shall be handed over to the student.</p>
  <p style="margin-left:20px">d. Also a student shall be offered a letter by Nyunga Foundation which will enable the student to enroll in the next academic term.</p>
  <p style="margin-left:20px"><strong>e. All this arrangement in paragraph 6 shall be facilitated by each parent at a cost of Ugx 50,000/= (Fifty thousand shillings only).</strong></p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">7. ALTERATION IN THE BURSARY OFFER</p>
  <p style="margin-left:20px">a. Incase the school offers its best in terms of educating a student who was offered a full bursary because of the student's good performance and without a school's fault, the student fails to perform academically to the expectation.</p>
  <p style="margin-left:20px">b. The student in <strong>paragraph 7a</strong> shall be given a grace period of one year to improve on his academic performance.</p>
  <p style="margin-left:20px">c. That incase a student fails to improve on his academic performance within the grace period provided for in <strong>paragraph 7b</strong>, the student's full bursary shall be altered to half bursary.</p>
  <p style="margin-left:20px">d. That in case a student in <strong>paragraph 7a, & c</strong> improves his academic performance to the expected academic excellence, such a student shall be restored to full bursary.</p>
  <p style="margin-left:20px">e. This arrangement in paragraph 7 is intended to ensure academic excellence of students.</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">8. PAYMENTS</p>
  <p style="margin-left:20px">a. Each parent shall pay functional fees of <strong>Ugx</strong>${blank(r.functional_fees, 120)}from next term until the learner completes this level.</p>
  <p style="margin-left:20px">b. Each parent shall pay medical fee for the leaner of <strong>ugx</strong>${blank(r.medical_fees, 120)}</p>

  <p style="text-decoration:underline;font-weight:bold;margin-top:12px">9. GOVERNING LAW.</p>
  <p style="margin-left:20px">This Agreement will be construed and enforced in accordance to the laws of the Republic of Uganda.</p>

  <p style="font-weight:bold;margin-top:16px"><strong>IN THE WITNESS WHEREOF</strong>, the parties hereto have appended their respective hand and signature on the date, month and year first above written without duress and coercion.</p>

  <!-- Signature blocks -->
  <div style="margin-top:24px">
    <p style="font-weight:bold">SIGNED and DELIVERED</p>
    <p style="font-weight:bold">By the said;</p>
    <p>1. PARENT'S NAME${blank(r.parent_name, 250)}SIGNATURE${signatureUrl ? `<img src="${signatureUrl}" style="height:40px;vertical-align:middle;margin-left:8px"/>` : blank("", 100)}</p>
    <p>&nbsp;&nbsp;&nbsp;CONTACT${blank(r.parent_contact || r.parent_phone, 250)}DATE${blank(dateStr, 120)}</p>
  </div>

  <div style="margin-top:16px">
    <p style="font-weight:bold">SIGNED and DELIVERED</p>
    <p style="font-weight:bold">By the said;</p>
    <p>2. STUDENT NAME${blank(r.student_name_sign || r.parent_of, 250)}SIGNATURE.........</p>
    <p>&nbsp;&nbsp;&nbsp;CONTACT${blank(r.student_contact, 250)}DATE................</p>
  </div>

  <div style="margin-top:16px">
    <p style="font-weight:bold">SIGNED and DELIVERED</p>
    <p style="font-weight:bold">By the said;</p>
    <p>3. NAME FOR DIRECTOR OF THE<br/>SCHOOL${blank(r.director_name, 300)}SIGNATURE..........</p>
    <p>&nbsp;&nbsp;&nbsp;CONTACT${blank(r.director_contact, 250)}DATE................</p>
  </div>

  <div style="margin-top:16px">
    <p style="font-weight:bold">SIGNED and DELIVERED</p>
    <p style="font-weight:bold">By the said;</p>
    <p>4. NAME FOR DIRECTOR OF NYUNGA<br/>FOUNDATION.............................................................SIGNATURE.......</p>
    <p>&nbsp;&nbsp;&nbsp;CONTACT..........................................................DATE................</p>
  </div>

  <div style="text-align:center;margin-top:30px">
    <p style="font-weight:bold">ALL IN THE PRESENCE OF</p>
    <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin-top:10px">
      <div>
        <p><img src="${lawyerSignatureImg}" alt="Advocate Signature" style="height:50px;"/></p>
        <p style="font-weight:bold">ADVOCATE</p>
        <p>CONTACT..0703022565</p>
        <p>DATE..${dateStr}</p>
      </div>
      <div>
        <img src="${lawyerStampImg}" alt="Advocate Stamp" style="height:80px;opacity:0.9;transform:rotate(-5deg)"/>
      </div>
    </div>
  </div>

  <div style="margin-top:20px;border-top:1px solid #000;padding-top:8px;text-align:center">
    <p style="font-size:9px;color:#555">This document was generated electronically by Nyunga Foundation Bursary Management System. Submitted on ${dateStr}.</p>
  </div>
</div>`;
};

export const generateLugandaDocumentHTML = (r: Record<string, any>, signatureUrl: string | null, submittedAt: string) => {
  const dateStr = new Date(submittedAt).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" });
  return `
<div style="font-family:'Times New Roman',serif;color:#000;background:#fff;padding:40px 50px;max-width:210mm;margin:0 auto;font-size:12px;line-height:1.6">
  ${r.application_number ? `<p style="text-align:right;font-size:11px;margin:0 0 6px 0"><strong>Application No:</strong> ${r.application_number}</p>` : ""}
  <p style="font-weight:bold;font-size:13px;text-decoration:underline;text-align:center;margin-bottom:4px">ENTEESEGANYA N'OKUKKAANYA EBITUUKIDDWAKO WAKATI W'ESSOMERO LYA: ${blank(r.essomero, 200)}</p>
  <p style="text-align:center;font-size:12px">${blank(r.essomero, 300)} <strong>NYUNGA FOUNDATION, N'OMUZADDE WA</strong></p>
  <p style="text-align:center;font-size:12px">${blank(r.omuzadde_erinnya, 300)} <strong>AGENDA MU</strong> ${blank(r.agenda, 60)} <strong>OMWAKA</strong>${blank(r.omwaka, 80)}</p>

  <p style="margin-top:16px">Oluvanyuma lwa Nyunga Foundation okusaba e ssomero lino ku lwa Foundation liweeyo bbasale ezijjudde ziweebwe abayizi abatalina busobozi bwa ssente bumala kubongerayo kusoma, e ssomero lyakiriza neriwaayo bbasale zino abayizi basome nga tebasasula bisale bye ssomero (Tuition Fees) okutuusa buli muyizi lwalimaliriza omutendera kwabeera ayingiridde mu ssomero lino.</p>

  <p>Abazadde n'abayizi abenjawulo bwe baategeezebwa ku mukisa guno, baawaayo okusaba kwabwe mu buwandiike nga baagala bayambibwe mu nteekateeka eno era bino wammanga bikaanyizidwaako olwaleero nga ennaku z'omwezi ${blank(r.ennaku_z_omwezi, 200)}</p>

  <p style="font-weight:bold;margin-top:16px">1.</p>
  <p style="margin-left:20px"><strong>(a)</strong> Bbasale eri ku bisale bya Ssomero (tuition fees) ebbanga lyonna. Omuyizi taggya kusasulanga "school fees" (tuition fees) ekisera kyonna kyanaamala nga asoma kumutendera guno mu ssomero lino. Omuyizi wakusasulanga byetaago bya ssomero byokka ebikkanyizidwako nga omwana aweebwa e kifo mu ssomero lino.</p>

  <p style="margin-left:20px"><strong>(b)</strong> Essomero <strong>teryefuulire muzadde na mwana</strong> nga lisaba e bisale by'essomero (Tuition fees) ekiseera kyonna omwana kyanaamala nga asoma ku mutendera guno gwayingirideko.</p>

  <p style="margin-left:20px"><strong>(c)</strong> Omuzadde alina okuba ng'akkirizza era nga asobola okusasula ebyetaago by'essomero (school requirements) ebiragiddwa nga omwana atandika okusoma. Kuno kuliko ebisasulwa buli lusoma (Termly requirements) n'ebisasulwa omulundi ogumu nga omwana ayingira mu ssomero nga bwe biragiddwa ku bbaluwa ewa omwana ekifo.</p>

  <p style="margin-left:20px"><strong>(d)</strong> Omuzadde alina okuba nga asobola okuwa omwana we ebyetaago ebimuyamba mu kusoma nga omuyizi, bino bikyuuka okusinziira ku muyizi kyaaba yeetaaga.</p>

  <p style="font-weight:bold;margin-top:16px">2.</p>
  <p style="margin-left:20px"><strong>(a)</strong> Omuyizi wa kusoma emyaka ${blank(r.emyaka_okusoma, 80)} nga takyusizza ssomero kugenda mu ddala.</p>

  <p style="margin-left:20px"><strong>(b)</strong> Singa e kiseera kituuka omuzadde n'omuyizi nebaagala okukyuusa e ssomero awatali buzibu bwonna butebeereka, nga kino bakikola lwakuba bafunye ssente ezimala okuweerera omwana ewalala yonna gye baagala, balina okusooka okusasula ebisale by'essomero (tuition fees) eby'ekiseera kyonna omwana kyasomedde mu ssomero lino awatali kwekwaasa nsonga yonna.</p>

  <p style="font-weight:bold;margin-top:16px">3.</p>
  <p style="margin-left:20px"><strong>(a)</strong> Omuzadde n'omwana balina okukkiriza n'okugoberera enteekateeka n'amateeka g'essomero gonna.</p>

  <p style="margin-left:20px"><strong>(b)</strong> Singa omuyizi n'omuzadde balemererwa okugoberera enteekateeka n'amateeka g'essomero, omwana ajibwako omukisa gwa bbasale nazzibwa e waka.</p>

  <p style="font-weight:bold;margin-top:16px">4.</p>
  <p style="margin-left:20px"><strong>(a)</strong> Kunkomerero yabuli lusoma, alipoota y'omuyizi ey'olusoma olwo, erireetebwanga ku Kkakkalabizo lya Nyunga Foundation okuva ku ssomero kisobozese okulondoola ensoma y'Omwana.</p>

  <p style="margin-left:20px">Oluvanyuma omuyizi n'omuzadde baliyitibwa mu lukiiko kisobozese okwogerako n'Omwana, okumanya ebimusomooza ku ssomero, okumuzzaamu amanyi n'essubi aleme okuva ku mulamwa gw'okusoma n'Omuzadde okwogerako naye n'okumujjukiza obuvunanyizibwa bwe eri omwana ne ssomero.</p>

  <p style="margin-left:20px">Oluvanyuma lw'olukiiko omuyizi aliwebwanga alipoota y'olusoma olwo oluweddeko n'ebbaluwa erimuzangayo ku ssomero olusoma olulibanga luddirira. Olw'enteekateeka eno n'ebirala, Omuzadde aliretanga 50,000/= zokka.</p>

  <p style="margin-left:20px"><strong>(b)</strong> Essomero lirina okutwala obuvunanyizibwa okusomesa omwana okulaba ng'akuuma omutindo kwayingiridde n'okusingawo.</p>

  <p style="margin-left:20px"><strong>(c)</strong> Essomero terisseewo mbeera yonna ku baana abayambibwa mungeri y'okubakozesa emirimu, okubawuula ku balala mu kusoma n'enteekateeka endala olwokuba bbo bali ku bbassale.</p>

  <p style="margin-left:20px"><strong>(d)</strong> Singa e ssomero likola buli kisoboka mu kusomesa omwana eyaweebwa bbasale ejudde olwokuba yali asoma bulungi emabega, omwana oyo naalemwa yekka okusoma obulungi nga ekizibu ekimulemesa okusoma obulungi tekivudde ku ssomero, aliweebwa ekisera kya mwaka mulamba (ensoma ssatu mu mwaka) yerwaneko. Bwalirememererwa okwerwanako okusoma obulungi, alizzibwa ku bbasale ey'ekitundu. Kyokka bwa lyerwanako naddamu kusoma obulungi alizzibwa ku bbasale ejudde. Kino kikolebwa okulaba nti abayizi bano tebagayaala nakuzzannyira mu kusoma, kibasobozese okukuuma omutindo ku nkomerero bayite bulungi ebigezo bya UNEB.</p>

  <p style="font-weight:bold;margin-top:16px">5.</p>
  <p style="margin-left:20px">Okutandika n'olusoma olwokubiri (term II) 2026, omuzadde wakusasulanga ${blank(r.functional_fees_lg, 200)} ez'ebyetaago by'essomero (functional fees) ne ${blank("", 200)} ez'obujjanjabi bwomwana obusookerwako singa abeera alwadde.</p>

  <p style="font-weight:bold;margin-top:20px;text-decoration:underline">OKUWA OBWEYAMO:</p>
  <p>Ffe abatadeko emikono wano wammanga, nga tetukakiddwa era tutegeera bulungi, tukkirizza okugoberera n'okuteekesa mu nkola byonna ebikaanyizidwako nga bwe biri mu kiwandiiko kino.</p>

  <!-- Signature section -->
  <div style="margin-top:24px">
    <p><strong>(i) &nbsp;&nbsp;Omuzadde</strong></p>
    <p>&nbsp;&nbsp;&nbsp;Erinnya ${blank(r.omuzadde_erinnya_sign || r.omuzadde_erinnya, 250)} Omukono${signatureUrl ? `<img src="${signatureUrl}" style="height:40px;vertical-align:middle;margin-left:8px"/>` : blank("", 150)}</p>
    <p>&nbsp;&nbsp;&nbsp;Essimu ${blank(r.omuzadde_essimu, 250)} Ennaku z'Omwezi${blank(dateStr, 200)}</p>
  </div>

  <div style="margin-top:12px">
    <p><strong>(ii) &nbsp;&nbsp;Omuyizi</strong></p>
    <p>&nbsp;&nbsp;&nbsp;Erinnya ${blank(r.omuyizi_erinnya, 250)} Omukono..................Ennaku z'Omwezi................</p>
  </div>

  <div style="margin-top:12px">
    <p><strong>(iii) &nbsp;&nbsp;Ssenkulu w'essomero (Director).</strong></p>
    <p>&nbsp;&nbsp;&nbsp;Erinnya ${blank(r.ssenkulu_essomero, 250)} Omukono.................</p>
    <p>&nbsp;&nbsp;&nbsp;Essimu ${blank(r.ssenkulu_essimu, 250)} Ennaku z'Omwezi.................</p>
  </div>

  <div style="margin-top:12px">
    <p><strong>(iv) &nbsp;&nbsp;Ssenkulu wa Nyunga Foundation</strong></p>
    <p>&nbsp;&nbsp;&nbsp;Erinnya ................................................... Omukono.................</p>
    <p>&nbsp;&nbsp;&nbsp;Essimu.................................................... Ennaku z'Omwezi .................</p>
  </div>

  <div style="margin-top:12px">
    <p><strong>(v) &nbsp;&nbsp;Munnamateeka alambise enteekateeka eno era avunanyizibwa okugirondoola okukakasa nti enteekebwa mu nkola buli muntu okutuukiriza obuvunanyizibwa bwe.</strong></p>
     <p>&nbsp;&nbsp;&nbsp;Erinnya: <strong>LUBWAMA EZRA TONNY</strong>&nbsp;&nbsp;Omukono <img src="${lawyerSignatureImg}" alt="Advocate Signature" style="height:40px;vertical-align:middle;"/></p>
     <p>&nbsp;&nbsp;&nbsp;Essimu: 0703022565&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ennaku z'Omwezi: ${dateStr}</p>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px">
    <p style="font-weight:bold">ETEESEGANYA EKOMYE WANO</p>
    <div style="text-align:center">
      <p style="font-weight:bold">STAMP</p>
      <img src="${lawyerStampImg}" alt="Advocate Stamp" style="height:80px;opacity:0.9;transform:rotate(-5deg)"/>
    </div>
  </div>

  <div style="margin-top:20px;border-top:1px solid #000;padding-top:8px;text-align:center">
    <p style="font-size:9px;color:#555">This document was generated electronically by Nyunga Foundation Bursary Management System. Submitted on ${dateStr}.</p>
  </div>
</div>`;
};

export const isEnglishTemplate = (templateId: string) =>
  templateId === "321907e6-2f61-437b-82ff-83ffdbef2cb7";

export const isLugandaTemplate = (templateId: string) =>
  templateId === "a6709119-b671-4189-9bc0-2fce364721ed";

export const generateFullDocumentHTML = (
  templateId: string,
  responses: Record<string, any>,
  signatureUrl: string | null,
  submittedAt: string
) => {
  if (isEnglishTemplate(templateId)) {
    return generateEnglishDocumentHTML(responses, signatureUrl, submittedAt);
  }
  if (isLugandaTemplate(templateId)) {
    return generateLugandaDocumentHTML(responses, signatureUrl, submittedAt);
  }
  // Fallback for unknown templates - simple field listing
  return null;
};

const PrintableLawyerForm = ({ template, responses, signatureUrl, submittedAt }: Props) => {
  const fullDoc = generateFullDocumentHTML(template.id, responses, signatureUrl, submittedAt);

  if (fullDoc) {
    return <div dangerouslySetInnerHTML={{ __html: fullDoc }} />;
  }

  // Fallback for templates without a full document layout
  const dateStr = new Date(submittedAt).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="print-lawyer-form" style={{ fontFamily: "Times New Roman, serif", color: "#000", background: "#fff", padding: "40px 50px", maxWidth: "210mm", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img src={nyungaLogo} alt="Nyunga Foundation" style={{ height: 60, marginBottom: 8 }} />
        <h2 style={{ fontSize: 16, fontWeight: "bold", margin: "4px 0", textTransform: "uppercase" }}>NYUNGA FOUNDATION</h2>
        <p style={{ fontSize: 11, margin: 0, fontStyle: "italic" }}>"Empowering Communities Through Education"</p>
      </div>
      <hr style={{ border: "1px solid #000", margin: "12px 0" }} />
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: "bold", textTransform: "uppercase", textDecoration: "underline", margin: "8px 0" }}>{template.title}</h3>
      </div>
      <div style={{ marginTop: 16 }}>
        {(template.fields || []).map((field) => (
          <div key={field.id} style={{ marginBottom: 12 }}>
            {field.type === "checkbox" ? (
              <div style={{ fontSize: 11, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>{responses[field.id] ? "☑" : "☐"}</span>
                <span>{field.label}</span>
              </div>
            ) : (
              <div style={{ fontSize: 11 }}>
                <span style={{ fontWeight: "bold" }}>{field.label}: </span>
                <span style={{ borderBottom: "1px dotted #000", paddingBottom: 1, minWidth: 200, display: "inline-block" }}>
                  {responses[field.id] || "______________________"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: "bold", marginBottom: 8 }}>Parent / Guardian Signature:</p>
          {signatureUrl ? (
            <img src={signatureUrl} alt="Signature" style={{ height: 50, border: "1px solid #ccc", borderRadius: 4, padding: 4, background: "#fff" }} />
          ) : (
            <div style={{ borderBottom: "1px solid #000", width: 200, height: 40 }} />
          )}
          <p style={{ fontSize: 10, marginTop: 4 }}>Date: {dateStr}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: "bold", marginBottom: 8 }}>Certified by Advocate:</p>
          <img src={lawyerStampImg} alt="Advocate Stamp" style={{ height: 70, opacity: 0.9, transform: "rotate(-5deg)" }} />
          <p style={{ fontSize: 9, marginTop: 4 }}>Advocate Lubwama Ezra Tonny</p>
          <p style={{ fontSize: 9 }}>ezratonny85@gmail.com</p>
        </div>
      </div>
      <div style={{ marginTop: 30, borderTop: "1px solid #000", paddingTop: 8, textAlign: "center" }}>
        <p style={{ fontSize: 9, color: "#555" }}>This document was generated electronically by Nyunga Foundation Bursary Management System. Submitted on {dateStr}.</p>
      </div>
    </div>
  );
};

export default PrintableLawyerForm;
