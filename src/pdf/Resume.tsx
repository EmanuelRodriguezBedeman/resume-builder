import { Document, Page, StyleSheet } from "@react-pdf/renderer";
import type { Resume as ResumeType } from "../types.ts";
import type { Locale } from "../save.ts";
import { Header } from "./Header.tsx";
import { SectionRenderer } from "./sections/index.tsx";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#000",
  },
});

export function Resume({
  resume,
  locale,
}: {
  resume: ResumeType;
  locale: Locale;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header header={resume.header} />
        {resume.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} locale={locale} />
        ))}
      </Page>
    </Document>
  );
}
