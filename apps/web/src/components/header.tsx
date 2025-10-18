"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	return (
		<header className="w-full px-4 pt-4 pb-2">
			<div className="mx-auto max-w-7xl">
				<div className="flex items-center justify-between px-6 py-4 bg-background border rounded-2xl shadow-sm">
					{/* Logo */}
					<Link 
						href="/" 
						className="flex items-center gap-2 font-semibold text-xl hover:opacity-80 transition-opacity"
					>
						<div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-lg">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="w-5 h-5"
							>
								<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
								<polyline points="14 2 14 8 20 8" />
								<line x1="16" y1="13" x2="8" y2="13" />
								<line x1="16" y1="17" x2="8" y2="17" />
								<line x1="10" y1="9" x2="8" y2="9" />
							</svg>
						</div>
						<span className="hidden sm:inline">Content-Next</span>
					</Link>

					{/* Actions */}
					<div className="flex items-center gap-3">
						<ModeToggle />
						<UserMenu />
					</div>
				</div>
			</div>
		</header>
	);
}
