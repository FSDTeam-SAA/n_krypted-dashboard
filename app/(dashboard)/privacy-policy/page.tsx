import { LegalContentEditorPage } from "@/components/legal/LegalContentEditorPage";

export default function PrivacyPolicyPage() {
  return (
    <LegalContentEditorPage
      field="privacyHtml"
      title="Datenschutzerklärung"
      description="Erstellen und aktualisieren Sie die Datenschutzerklärung, die in der mobilen App angezeigt wird."
    />
  );
}
