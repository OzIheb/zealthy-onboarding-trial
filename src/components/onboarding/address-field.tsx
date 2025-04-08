import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from 'react-hook-form';

export interface AddressData {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
}

interface AddressFieldProps {
    value: AddressData;
    onChange: (fieldName: keyof AddressData, value: string) => void;
    errors?: {
        streetAddress?: FieldError;
        city?: FieldError;
        state?: FieldError;
        zipCode?: FieldError;
    };
}

export function AddressField({
    value,
    onChange,
    errors = {} 
}: AddressFieldProps) {
    const handleChange = (fieldName: keyof AddressData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(fieldName, e.target.value);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                    id="streetAddress"
                    placeholder="123 Main St"
                    value={value.streetAddress}
                    onChange={handleChange('streetAddress')}
                    className={errors.streetAddress ? 'border-destructive' : ''}
                />
                {errors.streetAddress && <p className="text-sm text-destructive">{errors.streetAddress.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                        id="city"
                        placeholder="Anytown"
                        value={value.city}
                        onChange={handleChange('city')}
                        className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                        id="state"
                        placeholder="CA"
                        value={value.state}
                        onChange={handleChange('state')}
                        className={errors.state ? 'border-destructive' : ''}
                    />
                    {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                        id="zipCode"
                        placeholder="90210"
                        value={value.zipCode}
                        onChange={handleChange('zipCode')}
                        className={errors.zipCode ? 'border-destructive' : ''}
                    />
                    {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
                </div>
            </div>
        </div>
    );
} 