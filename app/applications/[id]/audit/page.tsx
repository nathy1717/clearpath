import Workspace from "@/components/workspace";

export default function AuditPage({
  params,
}: {
  params: { id: string };
}) {
  return <Workspace id={params.id} view="audit" />;
}
