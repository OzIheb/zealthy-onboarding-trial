import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import prisma from '@/lib/prisma';
import { User } from '../generated/prisma';

export const dynamic = 'force-dynamic';

export default async function DataPage() {
    let users: User[] = [];
    let fetchError: string | null = null;

    try {
        users = await prisma.user.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        fetchError = "Could not fetch user data at this time.";
    }

    // Helper to format dates or return 'N/A'
    const formatDate = (date: Date | null | undefined): string => {
        return date ? format(date, 'PPp') : 'N/A'; 
    }
     const displayOptionalString = (value: string | null | undefined): string => {
         return value ?? 'N/A';
     }

    const formatAddress = (user: User): string => {
        const parts = [
            user.streetAddress,
            user.city,
            user.state,
            user.zipCode
        ].filter(Boolean); 
        
        if (parts.length === 0) {
            return 'N/A';
        }
        
        return parts.join(', '); 
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-semibold mb-6 text-blue-600">User Data</h1>

            {fetchError && <p className="text-destructive mb-4">Error: {fetchError}</p>}

            {!fetchError && users.length === 0 && <p>No users found.</p>}

            {!fetchError && users.length > 0 && (
                <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <Table>
                        <TableCaption>A list of registered users.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">User ID</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Onboarding Step</TableHead>
                                <TableHead>Birthdate</TableHead>
                                <TableHead>Full Address</TableHead>
                                <TableHead>About Me</TableHead>
                                <TableHead className="text-right">Created At</TableHead>
                                <TableHead className="text-right">Updated At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    {/* Use monospace for ID for better readability */}
                                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-center">{user.onboardingStep}</TableCell>
                                    <TableCell>{formatDate(user.birthdate)}</TableCell>
                                     <TableCell>{formatAddress(user)}</TableCell>
                                     <TableCell>{displayOptionalString(user.aboutMe)}</TableCell>
                                    <TableCell className="text-right">{formatDate(user.createdAt)}</TableCell>
                                    <TableCell className="text-right">{formatDate(user.updatedAt)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
} 