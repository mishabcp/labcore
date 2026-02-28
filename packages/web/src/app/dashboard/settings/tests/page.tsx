'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, ActivitySquare } from 'lucide-react';
import Link from 'next/link';

interface TestParameter {
    id: string;
    name: string;
    unit: string | null;
    resultType: string;
    referenceRange: string | null;
}

interface TestDefinition {
    id: string;
    testName: string;
    testCode: string | null;
    department: string | null;
    sampleType: string | null;
    isPanel: boolean;
    price: number;
    isActive: boolean;
    parameters: TestParameter[];
}

export default function TestsPage() {
    const { t } = useTranslation();
    const [tests, setTests] = useState<TestDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTests();
    }, [searchQuery]);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const url = searchQuery ? `/tests?search=${encodeURIComponent(searchQuery)}` : '/tests';
            const data = await api.get(url);
            setTests(data);
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const deactivateTest = async (id: string) => {
        if (!window.confirm('Are you sure you want to deactivate this test?')) return;
        try {
            await api.patch(`/tests/${id}/deactivate`);
            fetchTests();
        } catch (error) {
            console.error('Failed to deactivate test:', error);
            alert('Failed to deactivate test');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('settings.tests')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage lab tests, profiles, panels, and their parameters.
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('common.add')}
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e: any) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Test Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Sample</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Parameters</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                                    Loading tests...
                                </TableCell>
                            </TableRow>
                        ) : tests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                                    No tests found. Add a new test to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tests.map((test) => (
                                <TableRow key={test.id} className={!test.isActive ? 'opacity-50' : ''}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center">
                                            <ActivitySquare className="h-4 w-4 text-gray-400 mr-2" />
                                            {test.testName}
                                            {!test.isActive && <Badge variant="secondary" className="ml-2 text-xs">Inactive</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{test.testCode || '-'}</TableCell>
                                    <TableCell>{test.department || '-'}</TableCell>
                                    <TableCell>{test.sampleType || '-'}</TableCell>
                                    <TableCell>
                                        {test.isPanel ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Panel</Badge>
                                        ) : (
                                            <span className="text-sm text-gray-500">Single</span>
                                        )}
                                    </TableCell>
                                    <TableCell>₹{Number(test.price).toFixed(2)}</TableCell>
                                    <TableCell>{test.parameters.length}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="mr-2 h-8">
                                            <Edit className="h-4 w-4 text-gray-500" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                            disabled={!test.isActive}
                                            onClick={() => deactivateTest(test.id)}
                                        >
                                            Deactivate
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
