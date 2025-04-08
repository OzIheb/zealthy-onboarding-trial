import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from 'react-hook-form';

interface AboutMeFieldProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    error?: FieldError;
}

export function AboutMeField({
    label = "About Me",
    placeholder = "Tell us a little about yourself...",
    value,
    onChange,
    error
}: AboutMeFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="aboutMe">{label}</Label>
            <Textarea
                id="aboutMe"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={error ? 'border-destructive' : ''}
                aria-invalid={error ? "true" : "false"}
            />
        </div>
    );
} 