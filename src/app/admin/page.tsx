'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentConfig, updateConfig,  } from '@/actions/configActions';
import { ConfigForm } from '@/components/admin/config-form';
import { OnboardingConfig } from '@/lib/validators/config';

export default function AdminPage() {
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getCurrentConfig();
        if (result.status === 'success' && result.config) {
          setConfig(result.config);
        } else {
          setError(result.message || 'Failed to load configuration.');
          setConfig(null);
        }
      } catch (err) {
        console.error("Error fetching config:", err);
        setError('An unexpected error occurred.');
        setConfig(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-600">Onboarding Configuration</CardTitle>
          <CardDescription>
            Assign onboarding fields (About Me, Address, Birthdate) to either Page 2 or Page 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading configuration...</p>}
          {error && <p className="text-destructive">Error: {error}</p>}
          {!isLoading && !error && config && (
            <ConfigForm
              initialConfig={config}
              updateConfigAction={updateConfig}
            />
          )}
          {!isLoading && !error && !config && (
            <p>Could not load configuration data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 