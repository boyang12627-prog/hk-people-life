import { createFileRoute } from "@tanstack/react-router";
import { LifeApp } from "@/components/life/LifeApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <LifeApp />;
}
