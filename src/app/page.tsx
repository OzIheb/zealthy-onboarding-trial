'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Progress } from "@/components/ui/progress"; 
import { Step1Form } from '@/components/onboarding/step-1-form';
import { createUserAction, updateUserOnboarding } from '@/actions/userActions';
import { getCurrentConfig } from '@/actions/configActions';
import { OnboardingConfig } from '@/lib/validators/config';
import { DynamicStepForm } from '@/components/onboarding/dynamic-step-form';
import { CheckCircleIcon } from 'lucide-react'; 



// Define the total number of steps
const TOTAL_STEPS = 3;

export default function OnboardingWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [userId, setUserId] = useState<string | null>(null); 
    const [config, setConfig] = useState<OnboardingConfig | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
    const [configError, setConfigError] = useState<string | null>(null);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false); 

    // Fetch configuration on mount
    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoadingConfig(true);
            setConfigError(null);
            try {
                const result = await getCurrentConfig();
                if (result.status === 'success' && result.config) {
                    setConfig(result.config);
                    console.log("Configuration loaded:", result.config); // Log loaded config
                } else {
                    setConfigError(result.message || 'Failed to load configuration.');
                }
            } catch (error) {
                console.error("Error fetching config:", error);
                setConfigError('An unexpected error occurred while fetching configuration.');
            } finally {
                setIsLoadingConfig(false);
            }
        };

        fetchConfig();
    }, []); 

    const handleNextStep = () => {
        console.log(`handleNextStep called: currentStep = ${currentStep}, isLoadingConfig = ${isLoadingConfig}, config = ${!!config}`);
        if (currentStep > 1 && (isLoadingConfig || !config)) {
             console.log("Attempted to advance step before config loaded. Returning.");
             return; 
         }

        if (currentStep < TOTAL_STEPS) {
            console.log(`Advancing step from ${currentStep} to ${currentStep + 1}`);
            setCurrentStep(prev => prev + 1);
        } else {
            console.warn(`handleNextStep called on the final step (${currentStep}), this might indicate an issue.`);
        }
    };

    const handleFinalStepSuccess = () => {
        console.log("Final step successful. Setting onboarding complete.");
        setIsOnboardingComplete(true);
    };

    const handleStep1Success = (newUserId: string) => {
        console.log("Step 1 Success! User ID:", newUserId);
        setUserId(newUserId);
    };

    useEffect(() => {
        if (currentStep === 1 && userId && !isLoadingConfig && config) {
            setCurrentStep(2);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, userId, isLoadingConfig, config]);

    const renderStepContent = () => {
        console.log(`renderStepContent called: currentStep = ${currentStep}, isOnboardingComplete = ${isOnboardingComplete}`);
        if (isOnboardingComplete) {
            console.log("Rendering Completion Message");
            return (
                <div className="text-center flex flex-col items-center justify-center space-y-3 min-h-[200px]"> 
                     <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    <p className="text-lg font-medium">Onboarding Complete!</p>
                    <p className="text-sm text-muted-foreground">Thank you for setting up your account.</p>
                </div>
            );
        }

        if (currentStep > 1 && isLoadingConfig) {
            return <div>Loading configuration...</div>;
        }
        if (currentStep > 1 && configError) {
            return <div className="text-destructive">Error: {configError}</div>;
        }
        if (currentStep > 1 && (!config || !userId)) {
            return <div className="text-destructive">User or configuration not available.</div>;
        }

        switch (currentStep) {
            case 1:
                console.log("Rendering Step 1");
                return <Step1Form
                    createUserAction={createUserAction}
                    onSubmitSuccess={handleStep1Success}
                />;
            case 2:
                 console.log("Rendering Step 2");
                 if (!userId || !config?.page2) {
                    console.error("Error rendering Step 2: Missing userId or config.page2");
                    return <div>Error: Missing data for step 2.</div>;
                 }
                // Render DynamicStepForm for Step 2
                return <DynamicStepForm
                    key={currentStep}
                    userId={userId}
                    fields={config.page2}
                    currentStep={currentStep}
                    updateUserAction={updateUserOnboarding} 
                    onSubmitSuccess={handleNextStep} 
                />;
            case 3:
                 console.log("Rendering Step 3");
                 if (!userId || !config?.page3) {
                    console.error("Error rendering Step 3: Missing userId or config.page3");
                    return <div>Error: Missing data for step 3.</div>;
                 }
                return <DynamicStepForm
                    key={currentStep}
                    userId={userId}
                    fields={config.page3}
                    currentStep={currentStep}
                    updateUserAction={updateUserOnboarding}
                    onSubmitSuccess={handleFinalStepSuccess} 
                />;
            default:
                console.warn(`Rendering Invalid Step: ${currentStep}`);
                return <div>Invalid Step</div>;
        }
    };

    const progressValue = isOnboardingComplete
        ? 100
        : Math.max(0, ((currentStep - 1) / TOTAL_STEPS) * 100);

    const getDescriptionText = () => {
        if (isOnboardingComplete) {
            return "You're all set!";
        }
        if (isLoadingConfig && currentStep > 1) {
            return 'Loading configuration...';
        }
        return `Let's get your account set up. Step ${currentStep} of ${TOTAL_STEPS}.`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-center text-blue-600">
                        {isOnboardingComplete ? "Setup Complete!" : "Welcome aboard!"} 
                    </CardTitle>
                    <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                         {getDescriptionText()}
                    </CardDescription>
                    <Progress value={progressValue} className="w-full mt-4 h-2 [&>div]:bg-blue-500" /> 
                </CardHeader>
                <CardContent className="min-h-[200px] py-6"> 
                    {renderStepContent()}
                </CardContent>
            </Card>
        </div>
    );
}
