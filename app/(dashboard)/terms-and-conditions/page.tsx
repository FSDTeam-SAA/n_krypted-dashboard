import { LegalContentEditorPage } from "@/components/legal/LegalContentEditorPage";

export default function TermsAndConditionsPage() {
  return (
    <LegalContentEditorPage
      field="termsHtml"
      title="Geschäftsbedingungen"
      description="Erstellen und aktualisieren Sie die Geschäftsbedingungen, die in der mobilen App angezeigt werden."
    />
  );
}
