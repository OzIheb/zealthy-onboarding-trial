'use server';

import { z } from 'zod';
import { step1Schema } from '@/lib/validators/auth';
import { getCurrentConfig } from './configActions';
import { revalidatePath } from 'next/cache';
import { OnboardingFieldType } from '@/lib/validators/config';
import { addressSchema } from '@/lib/validators/common';
import { UpdateUserActionState } from '@/types/actions';
import prisma from '@/lib/prisma';
interface CreateUserActionState { 
    status: 'idle' | 'success' | 'error';
    message: string;
    userId?: string;
    errors?: Record<string, string[]>;
}

export async function createUserAction(prevState: CreateUserActionState, formData: FormData): Promise<CreateUserActionState> {
    const validatedFields = step1Schema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'Invalid form data.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { email, password } = validatedFields.data;

    try {
        // 2. Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return {
                status: 'error',
                message: 'An account with this email already exists.',
                // Optionally, return field-specific error
                errors: { email: ['Email already in use.'] }
            };
        }

        // 3. Create the user (SKIPPING PASSWORD HASHING because this is a trial)
        const newUser = await prisma.user.create({
            data: {
                email,
                password: password, 
                // onboardingStep defaults to 1 in schema
            },
        });

        // 4. Return success state
        return {
            status: 'success',
            message: 'Account created successfully!',
            userId: newUser.id, // Pass the new user ID back
        };

    } catch (error) {
        console.error("Error creating user:", error);
        // Generic error for unexpected issues
        return {
            status: 'error',
            message: 'An unexpected error occurred. Please try again.',
        };
    }
}

export async function updateUserOnboarding(
    prevState: UpdateUserActionState,
    formData: FormData
): Promise<UpdateUserActionState> {

    // 1. Extract base data (userId, currentStep)
    const userId = formData.get('userId') as string;
    const currentStep = parseInt(formData.get('currentStep') as string, 10);

    if (!userId || isNaN(currentStep)) {
        return { status: 'error', message: 'Missing user ID or step information.' };
    }

    // 2. Fetch current configuration
    const configResult = await getCurrentConfig();
    if (configResult.status !== 'success' || !configResult.config) {
        return { status: 'error', message: `Failed to load configuration to validate step ${currentStep}.` };
    }

    const expectedFields: OnboardingFieldType[] = currentStep === 2
        ? configResult.config.page2
        : configResult.config.page3;

    if (!expectedFields || expectedFields.length === 0) {
         return { status: 'error', message: `No fields configured for step ${currentStep}.` };
    }

    // 3. Dynamically generate schema using the imported addressSchema
    const coreFieldSchemas = {
        aboutMe: z.string().min(10, "Please tell us a bit more (at least 10 characters)."),
        address: addressSchema, // Use the imported object schema
        birthdate: z.preprocess((arg) => {
            if (typeof arg === 'string' && arg.length > 0) {
                const date = new Date(arg);
                return isNaN(date.getTime()) ? arg : date;
            }
            return arg;
        }, z.date({ invalid_type_error: "Please select a valid date." })
            .refine(val => val < new Date(), "Birthdate must be in the past."))
    };

    // Build the schema object using only the core schemas for the fields expected in this step
    const stepSchemaObject = expectedFields.reduce((acc, fieldName) => {
        if (fieldName in coreFieldSchemas) {
            acc[fieldName] = coreFieldSchemas[fieldName as keyof typeof coreFieldSchemas];
        }
        return acc;
    }, {} as { [K in OnboardingFieldType]?: z.ZodTypeAny });

    const stepSchema = z.object(stepSchemaObject);

    // Extract data from FormData for validation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataToValidate: Record<string, any> = {};
    for (const field of expectedFields) {
        if (field === 'address') {
            // If address is expected, gather its parts into an object
            dataToValidate.address = {
                streetAddress: formData.get('streetAddress'),
                city: formData.get('city'),
                state: formData.get('state'),
                zipCode: formData.get('zipCode'),
            };
        } else {
            // For other fields, get them directly
            dataToValidate[field] = formData.get(field);
        }
    }

    const validatedFields = stepSchema.safeParse(dataToValidate);

    if (!validatedFields.success) {
        console.log("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            status: 'error',
            message: 'Invalid form data for this step.',
            errors: validatedFields.error.flatten().fieldErrors as z.inferFlattenedErrors<typeof stepSchema>['fieldErrors'],
        };
    }

    // 4. Prepare data for Prisma update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataToUpdate: any = {}; // Temporarily using any due to type issues
    for (const field of expectedFields) {
        // Check if the field exists in the validated data
        if (field in validatedFields.data) {
            // Get the value safely. TypeScript knows 'field' is a key here.
            const value = validatedFields.data[field];
            
            if (value !== undefined) { // Ensure value is not undefined before proceeding
                if (field === 'address') {
                    // We know value is address object here due to schema validation
                    const addressData = value as z.infer<typeof addressSchema>; 
                    dataToUpdate.streetAddress = addressData.streetAddress;
                    dataToUpdate.city = addressData.city;
                    dataToUpdate.state = addressData.state;
                    dataToUpdate.zipCode = addressData.zipCode;
                } else {
                    // Assign other fields directly.
                    // Cast to 'any' might be needed if 'field' name doesn't directly
                    // map to a User model field acceptable by Prisma.UserUpdateInput.
                    // Ideally, map field names explicitly if they differ from DB columns.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    dataToUpdate[field] = value as any; 
                }
            }
        }
    }

    // 5. Update user in database
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
             return { status: 'error', message: 'User not found.' };
        }

        const nextStep = currentStep + 1;

        await prisma.user.update({
            where: { id: userId },
            data: {
                ...dataToUpdate,
                onboardingStep: nextStep,
            },
        });

        // 6. Revalidate data page
        revalidatePath('/data');

        // 7. Return success
        return { status: 'success', message: `Step ${currentStep} completed!` };

    } catch (error) {
        console.error(`Error updating user for step ${currentStep}:`, error);
        return { status: 'error', message: 'An unexpected error occurred saving your progress.' };
    }
}
