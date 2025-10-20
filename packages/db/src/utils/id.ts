import { nanoid } from "nanoid";

/**
 * Generate a unique ID using nanoid
 * @param size - Optional size parameter for the ID (default: 21)
 * @returns A unique string ID
 */
export function generateId(size?: number): string {
	return nanoid(size);
}

/**
 * Generate a unique API key with the format: cn_{32-char-nanoid}
 * @returns A unique API key string
 */
export function generateApiKey(): string {
	return `cn_${nanoid(32)}`;
}
