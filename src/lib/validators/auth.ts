import { z } from 'zod';

export const step1Schema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});

export type Step1Data = z.infer<typeof step1Schema>; 