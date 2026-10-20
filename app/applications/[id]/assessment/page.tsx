import Workspace from "@/components/workspace";

export default async function AssessmentPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  return <Workspace id={params.id} view="assessment" />;
}
