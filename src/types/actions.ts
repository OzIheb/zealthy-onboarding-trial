import { FieldErrorsImpl } from 'react-hook-form';

// Define the actual state structure returned by updateUserOnboarding
export interface UpdateUserActionState {
    status: 'idle' | 'success' | 'error';
    message: string;
    // Errors structure directly from Zod flatten().fieldErrors
    errors?: Record<string, string[] | Record<string, string[]>>;
}

// You can add other shared action state types here 