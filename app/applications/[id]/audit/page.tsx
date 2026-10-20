import Workspace from "@/components/workspace";

export default async function AuditPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  return <Workspace id={params.id} view="audit" />;
}
