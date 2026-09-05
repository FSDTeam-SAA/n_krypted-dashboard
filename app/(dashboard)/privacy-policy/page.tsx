import { LegalContentEditorPage } from "@/components/legal/LegalContentEditorPage";

export default function PrivacyPolicyPage() {
  return (
    <LegalContentEditorPage
      field="privacyHtml"
      title="Datenschutzrichtlinie"
      description="Erstellen und aktualisieren Sie die Datenschutzrichtlinie, die in der mobilen App angezeigt wird."
    />
  );
}
