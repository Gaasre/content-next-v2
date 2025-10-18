"use client";

import { useState } from "react";
import { Plus, Type, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/utils/orpc";
import { useWebsite } from "@/contexts/website-context";
import { toast } from "sonner";

interface AddSiteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddSiteDialog({ open, onOpenChange }: AddSiteDialogProps) {
	const [name, setName] = useState("");
	const [domain, setDomain] = useState("");
	const { setCurrentWebsite } = useWebsite();
	const queryClient = useQueryClient();

	interface Website {
		id: string;
		name: string;
		domain: string;
		apiKey: string;
		userId: string;
		createdAt: Date;
		updatedAt: Date;
	}

	const createMutation = useMutation<Website, Error, { name: string; domain: string }>({
		mutationFn: async (input) => {
			return await client.website.create(input);
		},
		onSuccess: (newWebsite) => {
			toast.success("Site created successfully!");
			setCurrentWebsite(newWebsite);
			queryClient.invalidateQueries({ queryKey: orpc.website.list.queryKey() });
			setName("");
			setDomain("");
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(`Failed to create site: ${error.message}`);
		},
	});

	const handleCreate = async () => {
		if (!name.trim() || !domain.trim()) return;
		createMutation.mutate({ name: name.trim(), domain: domain.trim() });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[340px] p-5">
				{/* Title */}
				<div className="flex items-center gap-2">
					<div className="size-7 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
						<Plus className="size-4 text-primary-foreground" />
					</div>
					<div>
						<h2 className="text-sm font-semibold tracking-tight">Add site</h2>
						<p className="text-[10px] text-muted-foreground">Create a new site to publish articles</p>
					</div>
				</div>

				{/* Form */}
				<div className="space-y-3 pt-1">
					{/* Name Field */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
							<Type className="size-3" />
							Name
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="My Blog"
							className={cn(
								"w-full px-2 py-1.5 text-sm rounded-md transition-all",
								"bg-transparent hover:bg-muted/30 focus:bg-muted/40",
								"border-none outline-none focus:ring-0",
								"text-foreground placeholder:text-muted-foreground/40"
							)}
							autoFocus
						/>
					</div>

					{/* Domain Field */}
					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
							<Globe className="size-3" />
							Domain
						</label>
						<input
							type="text"
							value={domain}
							onChange={(e) => setDomain(e.target.value)}
							placeholder="myblog.com"
							className={cn(
								"w-full px-2 py-1.5 text-sm rounded-md transition-all",
								"bg-transparent hover:bg-muted/30 focus:bg-muted/40",
								"border-none outline-none focus:ring-0",
								"text-foreground placeholder:text-muted-foreground/40"
							)}
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-2 pt-3">
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						disabled={createMutation.isPending}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleCreate}
						disabled={!name.trim() || !domain.trim() || createMutation.isPending}
						className={cn(
							"px-3 py-1.5 text-xs font-medium rounded-md transition-all",
							name.trim() && domain.trim() && !createMutation.isPending
								? "bg-foreground text-background hover:bg-foreground/90"
								: "bg-muted text-muted-foreground cursor-not-allowed"
						)}
					>
						{createMutation.isPending ? (
							<span className="flex items-center gap-2">
								<div className="size-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
								Creating...
							</span>
						) : (
							"Create"
						)}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

