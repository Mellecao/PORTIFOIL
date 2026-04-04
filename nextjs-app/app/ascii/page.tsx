import AsciiCursorField from "@/components/AsciiCursorField";

export const metadata = {
  title: "ASCII Cursor Field — Miguel Melle",
};

export default function AsciiPage() {
  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <AsciiCursorField />
    </main>
  );
}
