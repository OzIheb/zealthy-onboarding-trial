'use client'; 

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils"; 
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { FieldError } from 'react-hook-form';

interface BirthdateFieldProps {
    label?: string;
    value: Date | undefined; // Allow undefined for initial state
    onChange: (date: Date | undefined) => void; // Pass selected date up
    error?: FieldError;
}

export function BirthdateField({
    label = "Birthdate",
    value,
    onChange,
    error
}: BirthdateFieldProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = (selectedDate: Date | undefined) => {
        onChange(selectedDate);
        setIsOpen(false); // Close popover on select
    }

    return (
        <div className="space-y-2">
             <Label htmlFor="birthdate">{label}</Label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        id="birthdate"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !value && "text-muted-foreground",
                            error ? 'border-destructive' : ''
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? format(value, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleSelect}
                        initialFocus
                         disabled={(date) =>
                           date > new Date() || date < new Date("1900-01-01")
                         }
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
} 