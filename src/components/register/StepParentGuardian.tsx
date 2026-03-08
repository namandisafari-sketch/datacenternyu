import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationForm, ParentDetail, GuardianDetail, NextOfKin } from "./types";
import PassportPhotoCapture from "./PassportPhotoCapture";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  userId: string;
}

const ParentDetailFields = ({
  label,
  data,
  onChange,
}: {
  label: string;
  data: ParentDetail;
  onChange: (field: keyof ParentDetail, value: string) => void;
}) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-foreground border-b pb-1">{label}</p>
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input value={data.name} onChange={(e) => onChange("name", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Occupation</Label>
        <Input value={data.occupation} onChange={(e) => onChange("occupation", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">National ID No. (NIN)</Label>
        <Input value={data.nin} onChange={(e) => onChange("nin", e.target.value.toUpperCase())} maxLength={14} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Residence</Label>
        <Input value={data.residence} onChange={(e) => onChange("residence", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Telephone Number</Label>
        <Input value={data.telephone} onChange={(e) => onChange("telephone", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Religion</Label>
        <Input value={data.religion} onChange={(e) => onChange("religion", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tribe</Label>
        <Input value={data.tribe} onChange={(e) => onChange("tribe", e.target.value)} />
      </div>
    </div>
  </div>
);

const StepParentGuardian = ({ form, update, userId }: Props) => {
  const updateFather = (field: keyof ParentDetail, value: string) => {
    update("fatherDetails", { ...form.fatherDetails, [field]: value });
  };
  const updateMother = (field: keyof ParentDetail, value: string) => {
    update("motherDetails", { ...form.motherDetails, [field]: value });
  };
  const updateGuardian = (field: keyof GuardianDetail, value: string) => {
    update("guardianDetails", { ...form.guardianDetails, [field]: value });
  };
  const updateKin = (field: keyof NextOfKin, value: string) => {
    update("nextOfKin", { ...form.nextOfKin, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Parent Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">2. PARENT / GUARDIAN PARTICULARS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm font-semibold text-muted-foreground">(a) PARENT</p>
          <ParentDetailFields label="FATHER" data={form.fatherDetails} onChange={updateFather} />
          <ParentDetailFields label="MOTHER" data={form.motherDetails} onChange={updateMother} />

          {/* Who pays fees */}
          <div className="space-y-2">
            <Label className="font-medium">Who is paying your school fees / requirements?</Label>
            <Select value={form.whoPaysFees} onValueChange={(v) => update("whoPaysFees", v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parent Passport Photo */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="font-medium">Parent/Guardian Passport Photo</Label>
            <p className="text-xs text-muted-foreground">Capture or upload a passport-size photo of the parent or guardian</p>
            <PassportPhotoCapture
              userId={userId}
              value={form.parentPassportPhotoUrl}
              onChange={(url) => update("parentPassportPhotoUrl", url)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guardian Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">(b) GUARDIAN'S PARTICULARS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={form.guardianDetails.name} onChange={(e) => updateGuardian("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Relationship with the Applicant</Label>
              <Input value={form.guardianDetails.relationship} onChange={(e) => updateGuardian("relationship", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Occupation</Label>
              <Input value={form.guardianDetails.occupation} onChange={(e) => updateGuardian("occupation", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">His/her National ID No. (NIN)</Label>
              <Input value={form.guardianDetails.nin} onChange={(e) => updateGuardian("nin", e.target.value.toUpperCase())} maxLength={14} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Residence (Village)</Label>
              <Input value={form.guardianDetails.residence} onChange={(e) => updateGuardian("residence", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Place of Work</Label>
              <Input value={form.guardianDetails.placeOfWork} onChange={(e) => updateGuardian("placeOfWork", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contact</Label>
              <Input value={form.guardianDetails.contact} onChange={(e) => updateGuardian("contact", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">(c) Next of Kin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={form.nextOfKin.name} onChange={(e) => updateKin("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Residence</Label>
              <Input value={form.nextOfKin.residence} onChange={(e) => updateKin("residence", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Relationship with Applicant</Label>
              <Input value={form.nextOfKin.relationship} onChange={(e) => updateKin("relationship", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tel</Label>
              <Input value={form.nextOfKin.telephone} onChange={(e) => updateKin("telephone", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Relative & Neighbor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">(d) Other Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">Name of any relative who lives near the school</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={form.nearbyRelative.name} onChange={(e) => update("nearbyRelative", { ...form.nearbyRelative, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Address (Village/Town)</Label>
              <Input value={form.nearbyRelative.address} onChange={(e) => update("nearbyRelative", { ...form.nearbyRelative, address: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contact</Label>
              <Input value={form.nearbyRelative.contact} onChange={(e) => update("nearbyRelative", { ...form.nearbyRelative, contact: e.target.value })} />
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground pt-2">Name of nearest neighbor at your home</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={form.nearestNeighbor.name} onChange={(e) => update("nearestNeighbor", { ...form.nearestNeighbor, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contacts</Label>
              <Input value={form.nearestNeighbor.contacts} onChange={(e) => update("nearestNeighbor", { ...form.nearestNeighbor, contacts: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepParentGuardian;
