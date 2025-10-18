export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.trim()
		// Replace spaces and special characters with hyphens
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function validateSlug(slug: string): boolean {
	// Only lowercase letters, numbers, and hyphens
	const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
	return slugRegex.test(slug);
}

