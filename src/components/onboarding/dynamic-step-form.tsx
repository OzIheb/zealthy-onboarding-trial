'use client';

import React, { useEffect, useMemo, startTransition } from 'react';
import { useForm,  FieldError as RHFFieldError, FieldErrorsImpl, } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { AboutMeField } from './about-me-field';
import { AddressField, AddressData } from './address-field';
import { BirthdateField } from './birthdate-field';
import { OnboardingFieldType } from '@/lib/validators/config';
import { addressSchema } from '@/lib/validators/common';
import { UpdateUserActionState } from '@/types/actions';

const coreFieldSchemas = {
    aboutMe: z.string().min(10, "Please tell us a bit more (at least 10 characters)."),
    address: addressSchema,
    birthdate: z.preprocess((arg) => {
             if (typeof arg === 'string' && arg.length > 0) {
                 const date = new Date(arg);
                 return isNaN(date.getTime()) ? arg : date;
             }
             return arg;
         }, z.date({ required_error: "Please select your birthdate.", invalid_type_error: "Please select a valid date."})
              .refine(val => val < new Date(), "Birthdate must be in the past."))
};

type AddressFieldErrors = Partial<Record<keyof AddressData, RHFFieldError>>;

const generateStepSchema = (fields: OnboardingFieldType[]) => {
    const stepSchemaObject = fields.reduce((acc, fieldName) => {
        if (fieldName in coreFieldSchemas) {
            // Ensure correct type mapping
            acc[fieldName as keyof typeof coreFieldSchemas] = coreFieldSchemas[fieldName as keyof typeof coreFieldSchemas];
        }
        return acc;
    }, {} as Partial<{ [K in OnboardingFieldType]: z.ZodTypeAny }>); // Use Partial for flexibility


// eslint-disable-next-line @typescript-eslint/no-explicit-any
    return z.object(stepSchemaObject) as z.ZodObject<any>; 
};


const initialUpdateState: UpdateUserActionState = { status: 'idle', message: '' };

interface DynamicStepFormProps {
    userId: string;
    fields: OnboardingFieldType[];
    currentStep: number;
    updateUserAction: (prevState: UpdateUserActionState, formData: FormData) => Promise<UpdateUserActionState>;
    onSubmitSuccess: () => void;
}

function SubmitButton({ isLastStep }: { isLastStep: boolean }) {
     const { pending } = useFormStatus();
     return (
         <Button
             type="submit"
             disabled={pending}
             className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
         >
             {pending ? 'Saving...' : (isLastStep ? 'Finish Onboarding' : 'Continue')}
         </Button>
     );
}

export function DynamicStepForm({
    userId,
    fields,
    currentStep,
    updateUserAction,
    onSubmitSuccess
}: DynamicStepFormProps) {

    const stepSchema = useMemo(() => generateStepSchema(fields), [fields]);
    // Infer type, explicitly handling potential address structure
    type StepFormData = z.infer<typeof stepSchema>;

    const [state, formAction] = useActionState(updateUserAction, initialUpdateState);

    // Initialize default values based on fields present
    const initialDefaultValues = useMemo(() => {
        const defaults: Partial<StepFormData> = {};
        if (fields.includes('aboutMe')) {
            defaults.aboutMe = '';
        }
        // Initialize address as an object with empty strings
        if (fields.includes('address')) {
            defaults.address = {
                streetAddress: '',
                city: '',
                state: '',
                zipCode: '',
            };
        }
        if (fields.includes('birthdate')) {
            defaults.birthdate = undefined;
        }
        return defaults;
    }, [fields]);

    const form = useForm<StepFormData>({
        resolver: zodResolver(stepSchema),
        defaultValues: initialDefaultValues as Partial<StepFormData>,
    });


     useEffect(() => {
        if (state.status === 'success') {
            onSubmitSuccess();
            form.reset(initialDefaultValues as Partial<StepFormData>);
        } else if (state.status === 'error') {
            if (state.errors) {
                const serverErrors = state.errors;
                Object.keys(serverErrors).forEach((field) => {
                    const fieldKey = field as keyof StepFormData;
                    const errorMessagesOrObject = serverErrors[field];

                    if (fieldKey === 'address' && typeof errorMessagesOrObject === 'object' && !Array.isArray(errorMessagesOrObject)) {
                        Object.keys(errorMessagesOrObject).forEach((subField) => {
                             const subFieldKey = subField as keyof AddressData;
                             if (['streetAddress', 'city', 'state', 'zipCode'].includes(subFieldKey)) {
                                const messages = (errorMessagesOrObject as Record<string, string[]>)[subFieldKey];
                                const messageString = Array.isArray(messages) ? messages.join(', ') : 'Invalid input';
                                form.setError(`address.${subFieldKey}`, {
                                     type: 'server',
                                     message: messageString,
                                 });
                            }
                        });
                    } else if (form.control._fields[fieldKey as string]) {
                         const messageString = Array.isArray(errorMessagesOrObject)
                             ? errorMessagesOrObject.join(', ')
                             : 'Server validation failed';
                         form.setError(fieldKey as string, { 
                             type: 'server',
                             message: messageString,
                         });
                     } else {
                        console.warn(`Received server error for unexpected or non-form field: ${field}`);
                     }
                });
            } else {
                console.error("Server Action Error (No field errors):", state.message);
            }
        }
     }, [state, onSubmitSuccess, form, initialDefaultValues]);

    const prepareFormData = (formData: FormData) => {
        formData.append('userId', userId);
        formData.append('currentStep', String(currentStep));

        const currentValues = form.getValues();

        if (fields.includes('aboutMe')) {
            formData.set('aboutMe', String(currentValues.aboutMe ?? ''));
        }
        if (fields.includes('address') && currentValues.address) {
            const addressKeys: (keyof AddressData)[] = ['streetAddress', 'city', 'state', 'zipCode'];
            addressKeys.forEach(key => {
                formData.set(key, String(currentValues.address![key] ?? ''));
            });
            formData.delete('address');
        }
        if (fields.includes('birthdate')) {
            const birthdateValue = currentValues.birthdate;
            if (birthdateValue instanceof Date) {
                formData.set('birthdate', birthdateValue.toISOString());
            } else {
                 formData.set('birthdate', '');
            }
        }
        return formData;
    };

    function isFieldError(error: unknown): error is RHFFieldError {
        return typeof error === 'object' && error !== null && 'type' in error && 'message' in error;
    }

    function getAddressErrors(errors: FieldErrorsImpl<StepFormData>): AddressFieldErrors | undefined {
        const addressFieldErrors = errors['address'] as FieldErrorsImpl<AddressData> | undefined;
        if (addressFieldErrors && typeof addressFieldErrors === 'object') {
             const addrErrors: AddressFieldErrors = {};
             if (isFieldError(addressFieldErrors.streetAddress)) addrErrors.streetAddress = addressFieldErrors.streetAddress;
             if (isFieldError(addressFieldErrors.city)) addrErrors.city = addressFieldErrors.city;
             if (isFieldError(addressFieldErrors.state)) addrErrors.state = addressFieldErrors.state;
             if (isFieldError(addressFieldErrors.zipCode)) addrErrors.zipCode = addressFieldErrors.zipCode;
             return Object.keys(addrErrors).length > 0 ? addrErrors : undefined;
        }
        return undefined;
    }

    return (
        <Form {...form}>
            {/* Pass the event target directly to FormData constructor */}
            <form onSubmit={form.handleSubmit((_data, event) => { 
                const htmlForm = event?.target as HTMLFormElement;
                if (htmlForm) {
                    // Wrap the action invocation in startTransition
                    startTransition(() => {
                        formAction(prepareFormData(new FormData(htmlForm)));
                    });
                }
             })} className="space-y-4">
                {fields.map((fieldName) => (
                    <FormField
                        key={fieldName}
                        control={form.control}
                        name={fieldName as string}
                        render={({ field, fieldState, formState }) => {
                             let errorForField: RHFFieldError | undefined = undefined;
                             if (isFieldError(fieldState.error)) {
                                 errorForField = fieldState.error;
                             } else if (fieldState.error) {
                                 console.warn("Unexpected error structure in fieldState:", fieldState.error);
                             }

                            let fieldComponent = null;
                            if (fieldName === 'aboutMe') {
                                fieldComponent = <AboutMeField value={String(field.value ?? '')} onChange={field.onChange} error={errorForField} />;
                            } else if (fieldName === 'address') {
                                // Ensure value is AddressData or the default
                                const addressValue = (field.value || initialDefaultValues.address) as AddressData;
                                // Get errors using the updated helper
                                const addressErrors = getAddressErrors(formState.errors);
                                fieldComponent = (
                                    <AddressField
                                        value={addressValue}
                                        onChange={(addressFieldName, newValue) => {
                                            // addressFieldName is already keyof AddressData (string)
                                            form.setValue(`address.${addressFieldName}`, newValue, {
                                                 shouldValidate: true,
                                                 shouldDirty: true
                                            });
                                        }}
                                        errors={addressErrors}
                                    />
                                );
                            } else if (fieldName === 'birthdate') {
                                fieldComponent = <BirthdateField value={field.value as Date | undefined} onChange={field.onChange} error={errorForField} />;
                            }

                             return (
                                 <FormItem>
                                      <FormControl>
                                          {fieldComponent}
                                      </FormControl>
                                     <FormMessage />
                                 </FormItem>
                             );
                        }}
                    />
                ))}
                 <SubmitButton isLastStep={currentStep === 3} />
            </form>
        </Form>
    );
} 