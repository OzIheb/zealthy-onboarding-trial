import { z } from 'zod';

export type OnboardingFieldType = 'aboutMe' | 'address' | 'birthdate';
export const ALL_FIELDS: OnboardingFieldType[] = ['aboutMe', 'address', 'birthdate'];

export interface OnboardingConfig {
    page2: OnboardingFieldType[];
    page3: OnboardingFieldType[];
}

export const defaultConfig: OnboardingConfig = {
    page2: ['aboutMe', 'address'],
    page3: ['birthdate'],
};

export const fieldTypeSchema = z.enum(['aboutMe', 'address', 'birthdate'] as const);

export const onboardingConfigSchema = z.object({
  page2: z.array(fieldTypeSchema).min(1,"Page 2 must have at least one field."),
  page3: z.array(fieldTypeSchema).min(1,"Page 3 must have at least one field."),
})
.refine(data => {
    const allFields = new Set([...data.page2, ...data.page3]);
    return allFields.size === data.page2.length + data.page3.length;
}, { message: "Fields cannot be assigned to multiple pages." })
 .refine(data => {
    const allFields = new Set([...data.page2, ...data.page3]);
    return ALL_FIELDS.every(field => allFields.has(field)) && allFields.size === ALL_FIELDS.length;
 }, { message: `All fields (${ALL_FIELDS.join(', ')}) must be assigned exactly once.` });

export const adminConfigFormSchema = z.object({
    aboutMe: z.enum(['2', '3']),
    address: z.enum(['2', '3']),
    birthdate: z.enum(['2', '3']),
})
.refine(data => {
     const assignments = Object.values(data);
     return assignments.includes('2') && assignments.includes('3');
 }, { message: "Both Page 2 and Page 3 must have at least one field assigned." });

