import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@content-next-v2/auth";
import { TimelineContainer } from "@/components/timeline/timeline-container";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <TimelineContainer />;
}
