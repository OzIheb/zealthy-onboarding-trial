'use client';

import React, { useEffect, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStatus } from 'react-dom';

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { step1Schema, Step1Data } from '@/lib/validators/auth';

interface ActionState {
    status: 'idle' | 'success' | 'error';
    message: string;
    userId?: string; 
    errors?: Record<string, string[]>; // Field-specific errors
}

const initialState: ActionState = { status: 'idle', message: '' };

interface Step1FormProps {
    createUserAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
    onSubmitSuccess: (userId: string) => void;
}

// Separate SubmitButton to use useFormStatus
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" // Blue button
        >
            {pending ? 'Creating Account...' : 'Continue'}
        </Button>
    );
}

export function Step1Form({ createUserAction, onSubmitSuccess }: Step1FormProps) {
    const [state, formAction] = useActionState(createUserAction, initialState);

    const form = useForm<Step1Data>({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // Effect to handle successful submission
    useEffect(() => {
        if (state.status === 'success' && state.userId) {
            // Call the success callback passed from the parent wizard
            onSubmitSuccess(state.userId);
        } else if (state.status === 'error') {
            // Handle potential field-specific errors returned from the action
            if (state.errors) {
                Object.entries(state.errors).forEach(([field, messages]) => {
                    form.setError(field as keyof Step1Data, {
                        type: 'server',
                        message: messages.join(', '),
                    });
                });
            }
            // You could also display a general error message using state.message
            console.error("Server Action Error:", state.message);
        }
    }, [state, onSubmitSuccess, form]);

    return (
        // The form now uses the formAction provided by useFormState
        <Form {...form}>
            <form action={formAction} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 {/* Display general error messages from the action state */}
                 {state.status === 'error' && !state.errors && (
                    <p className="text-sm font-medium text-destructive">{state.message}</p>
                )}
                <SubmitButton />
            </form>
        </Form>
    );
} 