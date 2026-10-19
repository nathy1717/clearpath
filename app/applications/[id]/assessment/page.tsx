import Workspace from "@/components/workspace";

export default function AssessmentPage({
  params,
}: {
  params: { id: string };
}) {
  return <Workspace id={params.id} view="assessment" />;
}
