import { Header } from "@/components/common/header";
import { Sidebar } from "@/components/common/sidebar";
import { Dashboard } from "@/components/dashboard/dashboard";
// import { BentoDashboard } from "@/components/bento-dashboard";

export default function Home() {
	return (
		<div className="flex h-screen bg-background">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 overflow-auto">
					{/* <BentoDashboard /> */}
					<Dashboard />
				</main>
			</div>
		</div>
	);
}
