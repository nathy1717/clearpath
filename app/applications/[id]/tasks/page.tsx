import Workspace from "@/components/workspace";

export default function TasksPage({
  params,
}: {
  params: { id: string };
}) {
  return <Workspace id={params.id} view="tasks" />;
}
