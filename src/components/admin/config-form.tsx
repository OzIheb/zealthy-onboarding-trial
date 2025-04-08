'use client';

import React, { useEffect, startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState, } from 'react';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OnboardingConfig, OnboardingFieldType } from '@/lib/validators/config';
import { useFormStatus } from 'react-dom';
const adminConfigFormSchema = z.object({
    aboutMe: z.enum(['2', '3'], { required_error: "Please assign 'About Me' to a page." }),
    address: z.enum(['2', '3'], { required_error: "Please assign 'Address' to a page." }),
    birthdate: z.enum(['2', '3'], { required_error: "Please assign 'Birthdate' to a page." }),
})
.refine(data => {
     const assignments = Object.values(data);
     return assignments.includes('2') && assignments.includes('3');
 }, { message: "Both Page 2 and Page 3 must have at least one field assigned.", path: [] }); // General form error


type AdminConfigFormData = z.infer<typeof adminConfigFormSchema>;

const ALL_FIELDS: OnboardingFieldType[] = ['aboutMe', 'address', 'birthdate'];

interface UpdateConfigActionState {
    status: 'idle' | 'success' | 'error';
    message: string;
    fieldErrors?: Record<string, string[] | undefined>; 
    formError?: string; 
}
const initialActionState: UpdateConfigActionState = { 
    status: 'idle', 
    message: '', 
    fieldErrors: undefined, 
    formError: undefined    
};

interface ConfigFormProps {
    initialConfig: OnboardingConfig;
    updateConfigAction: (prevState: UpdateConfigActionState, formData: FormData) => Promise<UpdateConfigActionState>;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="mt-6 w-full bg-blue-600 hover:bg-blue-700">
            {pending ? 'Saving Configuration...' : 'Save Configuration'}
        </Button>
    );
}

const mapConfigToFormValues = (config: OnboardingConfig): AdminConfigFormData => {
    const formValues: Partial<AdminConfigFormData> = {};
    ALL_FIELDS.forEach(field => {
        if (config.page2.includes(field)) {
            formValues[field] = '2';
        } else if (config.page3.includes(field)) {
            formValues[field] = '3';
        }
    });
    return formValues as AdminConfigFormData;
};


// --- Main Form Component ---
export function ConfigForm({ initialConfig, updateConfigAction }: ConfigFormProps) {
    const [state, formAction] = useActionState(updateConfigAction, initialActionState);

    const form = useForm<AdminConfigFormData>({
        resolver: zodResolver(adminConfigFormSchema),
        defaultValues: mapConfigToFormValues(initialConfig),
        mode: 'onBlur',
    });

    const handleFormSubmit = (data: AdminConfigFormData) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        startTransition(() => {
            formAction(formData);
        });
    };

    useEffect(() => {
        form.clearErrors();
        
        if (state.status === 'success') {
            alert(state.message); 
        } else if (state.status === 'error') {
             if (state.fieldErrors) {
                Object.entries(state.fieldErrors).forEach(([field, messages]) => {
                    if (messages && field in form.getValues()) {
                         form.setError(field as keyof AdminConfigFormData, {
                             type: 'server',
                             message: messages.join(', '),
                         });
                     }
                });
             }
             
             if (state.formError) {
                 form.setError('root.formError', { type: 'server', message: state.formError });
             }
             
             console.error("Config Update Action Error:", state.message, "Field Errors:", state.fieldErrors, "Form Error:", state.formError);
        }
    }, [state, form]);


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                {ALL_FIELDS.map((fieldName) => (
                    <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                            <FormItem className="space-y-3 border p-4 rounded-md shadow-sm">
                                <FormLabel className="font-semibold capitalize">
                                     {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex space-x-4"
                                        aria-labelledby={`label-${fieldName}`}
                                    >
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <RadioGroupItem value="2" id={`${fieldName}-page2`} />
                                            </FormControl>
                                            <FormLabel htmlFor={`${fieldName}-page2`} className="font-normal">
                                                Page 2
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2">
                                            <FormControl>
                                                <RadioGroupItem value="3" id={`${fieldName}-page3`} />
                                            </FormControl>
                                            <FormLabel htmlFor={`${fieldName}-page3`} className="font-normal">
                                                Page 3
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}

                 {form.formState.errors.root?.formError && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.root.formError.message}</p>
                )}

                <SubmitButton />
            </form>
        </Form>
    );
} 