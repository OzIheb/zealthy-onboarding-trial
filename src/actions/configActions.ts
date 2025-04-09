'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
    OnboardingConfig,
    OnboardingFieldType,
    onboardingConfigSchema,
    adminConfigFormSchema,
    defaultConfig 
} from '@/lib/validators/config';
import prisma from '@/lib/prisma';

interface GetConfigActionState {
    status: 'success' | 'error';
    config?: OnboardingConfig;
    message: string;
}
interface UpdateConfigActionState {
    status: 'idle' | 'success' | 'error';
    message: string;
    fieldErrors?: z.ZodError<z.infer<typeof adminConfigFormSchema>>['formErrors']['fieldErrors'];
    formError?: string;
}

export async function getCurrentConfig(): Promise<GetConfigActionState> {
    try {
        const dbConfigRecord = await prisma.onboardingConfiguration.findUnique({ where: { id: 1 } });
        let configToUse: OnboardingConfig;
        let message: string;

        if (!dbConfigRecord || !dbConfigRecord.configData) {
            console.warn("Using default onboarding configuration.");
            // Use imported defaultConfig and onboardingConfigSchema
            const validation = onboardingConfigSchema.safeParse(defaultConfig);
            if (!validation.success) {
                console.error("FATAL: Default configuration is invalid:", validation.error.flatten());
                return { status: 'error', message: 'Default configuration is invalid. Please check defaults.' };
             }
            // Explicit cast here
            configToUse = validation.data as OnboardingConfig;
            message = 'Using default configuration.';
        } else {
            const parsedConfig = dbConfigRecord.configData as unknown;
            // Use imported onboardingConfigSchema
            const validation = onboardingConfigSchema.safeParse(parsedConfig);
            if (!validation.success) {
                 console.error("Invalid DB config:", validation.error.flatten());
                 const defaultValidation = onboardingConfigSchema.safeParse(defaultConfig);
                 if (!defaultValidation.success) { 
                     console.error("FATAL: Both DB and default configurations are invalid.");
                     return { status: 'error', message: 'Database and default configurations are invalid.' };
                  }
                 configToUse = defaultValidation.data as OnboardingConfig;
                 message = 'Using default configuration due to invalid DB data.';
            } else {
                 configToUse = validation.data as OnboardingConfig;
                 message = 'Configuration loaded from database.';
            }
        }
        return { status: 'success', config: configToUse, message: message };
    } catch (error) {
        console.error("Error fetching config:", error);
        try {
            const validation = onboardingConfigSchema.safeParse(defaultConfig);
            if (!validation.success) { 
                 console.error("FATAL: Error fetching DB config AND Default configuration is invalid:", validation.error.flatten());
                 return { status: 'error', message: 'Failed to fetch configuration and default is invalid.' };
              }
            return { status: 'success', config: validation.data as OnboardingConfig, message: 'Using default configuration due to error.' };
        } catch (defaultError) { 
            console.error("Critical error: Failed to fetch config and failed to parse default config:", defaultError);
            return { status: 'error', message: 'Critical error fetching or parsing configuration.' };
         }
    }
}

export async function updateConfig(
    prevState: UpdateConfigActionState,
    formData: FormData
): Promise<UpdateConfigActionState> {

    console.log(formData)

    const validatedFormData = adminConfigFormSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFormData.success) {
        const flattenedErrors = validatedFormData.error.flatten();
        console.log("Admin Config Validation Errors:", flattenedErrors);

        const specificFormError = flattenedErrors.formErrors.length > 0 
            ? flattenedErrors.formErrors.join(', ') 
            : undefined;
            
        const generalMessage = specificFormError ?? "Invalid configuration data provided.";

        return {
            status: 'error',
            message: generalMessage,
            fieldErrors: flattenedErrors.fieldErrors, 
            formError: specificFormError, 
        };
    }

    const newConfig: OnboardingConfig = { page2: [], page3: [] };
    (Object.keys(validatedFormData.data) as OnboardingFieldType[]).forEach(field => {
        if (validatedFormData.data[field] === '2') newConfig.page2.push(field);
        else if (validatedFormData.data[field] === '3') newConfig.page3.push(field);
    });

     const finalStructureValidation = onboardingConfigSchema.safeParse(newConfig);
     if (!finalStructureValidation.success) {
         console.error("Error: Generated config structure invalid:", finalStructureValidation.error.flatten());
         return { 
             status: 'error', 
             message: "Internal error generating config.", 
             formError: "Internal server error while structuring configuration." 
            };
      }

    try {
        await prisma.onboardingConfiguration.upsert({
            where: { id: 1 },
            update: { configData: finalStructureValidation.data },
            create: { id: 1, configData: finalStructureValidation.data },
        });

        revalidatePath('/admin');
        revalidatePath('/');

        return { status: 'success', message: 'Configuration updated successfully!' };

    } catch (error) { 
         console.error("Error updating config:", error);
        return { 
            status: 'error', 
            message: 'Database error saving configuration.', 
            formError: 'Could not save configuration due to a database issue.' 
           };
     }
}

