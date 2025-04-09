
// Define the actual state structure returned by updateUserOnboarding
export interface UpdateUserActionState {
    status: 'idle' | 'success' | 'error';
    message: string;
    errors?: Record<string, string[] | Record<string, string[]>>;
}
