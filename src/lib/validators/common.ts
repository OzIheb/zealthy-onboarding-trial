import { z } from 'zod';

export const addressSchema = z.object({
    streetAddress: z.string().min(1, "Street address is required."),
    city: z.string().min(1, "City is required."),
    state: z.string().min(1, "State is required."), // Could add stricter validation (e.g., 2-letter code)
    zipCode: z.string().min(4, "Zip code must be at least 4 digits.").max(10, "Zip code too long."), // Basic zip validation
});
