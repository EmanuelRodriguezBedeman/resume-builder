import { Document, Page, StyleSheet } from "@react-pdf/renderer";
import type { Resume as ResumeType } from "../types.ts";
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

export function Resume({ resume }: { resume: ResumeType }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header header={resume.header} />
        {resume.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </Page>
    </Document>
  );
}
