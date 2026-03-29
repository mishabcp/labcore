'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ActivitySquare } from 'lucide-react';
import {
    dashboardPremium,
    DashboardListSkeleton,
    DashboardPageHeader,
    DashboardPageScaffold,
    DashboardToolbarPanel,
    DashboardErrorBanner,
} from '@/components/dashboard-premium-shell';
import {
    DashboardDatasetExportActions,
    DashboardListSearchField,
    DashboardListSortControl,
} from '@/components/dashboard-list-controls';
import { useDebouncedValue } from '@/lib/dashboard-list-tools';
import { cn } from '@/lib/utils';

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

type SortKey = 'testName' | 'testCode' | 'department' | 'sampleType' | 'price' | 'parameters' | 'type';

const exportColumns: { key: string; header: string }[] = [
    { key: 'testName', header: 'Test name' },
    { key: 'testCode', header: 'Code' },
    { key: 'department', header: 'Department' },
    { key: 'sampleType', header: 'Sample' },
    { key: 'type', header: 'Type' },
    { key: 'price', header: 'Price (INR)' },
    { key: 'parameterCount', header: 'Parameters' },
    { key: 'status', header: 'Status' },
];

function departmentLabel(d: string | null) {
    if (!d) return '';
    return d.replace(/_/g, ' ');
}

export default function TestsPage() {
    const { t } = useTranslation();
    const [tests, setTests] = useState<TestDefinition[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebouncedValue(searchInput);
    const [typeFilter, setTypeFilter] = useState<'' | 'panel' | 'single'>('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('testName');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTests = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.get('/tests');
            setTests(Array.isArray(data) ? data : []);
        } catch {
            setTests([]);
            setError('Could not load tests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const needle = debouncedSearch.toLowerCase();

    const departmentOptions = useMemo(() => {
        const set = new Set<string>();
        for (const test of tests) {
            if (test.department) set.add(test.department);
        }
        return Array.from(set).sort((a, b) =>
            departmentLabel(a).localeCompare(departmentLabel(b), undefined, { sensitivity: 'base' }),
        );
    }, [tests]);

    const filteredTests = useMemo(() => {
        let list = tests;
        if (typeFilter === 'panel') {
            list = list.filter((t) => t.isPanel);
        } else if (typeFilter === 'single') {
            list = list.filter((t) => !t.isPanel);
        }
        if (departmentFilter) {
            list = list.filter((t) => t.department === departmentFilter);
        }
        if (!needle) return list;
        return list.filter((test) => {
            const priceStr = Number(test.price).toFixed(2);
            const blob = [
                test.testName,
                test.testCode,
                test.department,
                departmentLabel(test.department),
                test.sampleType,
                test.isPanel ? 'panel' : 'single',
                priceStr,
                String(test.parameters.length),
                test.isActive ? 'active' : 'inactive',
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return blob.includes(needle);
        });
    }, [tests, typeFilter, departmentFilter, needle]);

    const sortedTests = useMemo(() => {
        const list = [...filteredTests];
        const dir = sortDir === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            if (sortKey === 'testCode') {
                return (a.testCode ?? '').localeCompare(b.testCode ?? '', undefined, { numeric: true }) * dir;
            }
            if (sortKey === 'department') {
                return departmentLabel(a.department).localeCompare(departmentLabel(b.department), undefined, {
                    sensitivity: 'base',
                }) * dir;
            }
            if (sortKey === 'sampleType') {
                return (a.sampleType ?? '').localeCompare(b.sampleType ?? '', undefined, { sensitivity: 'base' }) * dir;
            }
            if (sortKey === 'price') {
                return (Number(a.price) - Number(b.price)) * dir;
            }
            if (sortKey === 'parameters') {
                return (a.parameters.length - b.parameters.length) * dir;
            }
            if (sortKey === 'type') {
                return (Number(a.isPanel) - Number(b.isPanel)) * dir;
            }
            return a.testName.localeCompare(b.testName, undefined, { sensitivity: 'base' }) * dir;
        });
        return list;
    }, [filteredTests, sortKey, sortDir]);

    const exportRows = useMemo(
        () =>
            sortedTests.map((test) => ({
                testName: test.testName,
                testCode: test.testCode ?? '',
                department: departmentLabel(test.department) || '—',
                sampleType: test.sampleType ?? '',
                type: test.isPanel ? 'Panel' : 'Single',
                price: Number(test.price).toFixed(2),
                parameterCount: String(test.parameters.length),
                status: test.isActive ? 'Active' : 'Inactive',
            })),
        [sortedTests],
    );

    const toggleSortDir = useCallback(() => {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }, []);

    const hasActiveFilters = Boolean(needle || typeFilter || departmentFilter);

    const clearFilters = useCallback(() => {
        setSearchInput('');
        setTypeFilter('');
        setDepartmentFilter('');
    }, []);

    const deactivateTest = async (id: string) => {
        if (!window.confirm('Are you sure you want to deactivate this test?')) return;
        try {
            await api.patch(`/tests/${id}/deactivate`);
            fetchTests();
        } catch {
            alert('Failed to deactivate test');
        }
    };

    return (
        <DashboardPageScaffold>
            <DashboardPageHeader
                eyebrow={t('nav.settings')}
                title={t('settings.tests')}
                subtitle="Search, filter by type and department, sort, and export. Manage panels, singles, and parameters."
                compact
                action={
                    <Button className="w-full shrink-0 sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('common.add')}
                    </Button>
                }
            />

            <DashboardToolbarPanel className="min-w-0">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-0.5 [-webkit-overflow-scrolling:touch]">
                    <div className="min-w-0 flex-1 space-y-2 lg:min-w-[min(100%,12rem)]">
                        <label htmlFor="tests-search" className={cn(dashboardPremium.labelClass, 'block')}>
                            Search
                        </label>
                        <DashboardListSearchField
                            id="tests-search"
                            value={searchInput}
                            onChange={setSearchInput}
                            placeholder="Name, code, department, sample type…"
                        />
                    </div>
                    <div className="w-full min-w-0 space-y-2 lg:w-40 lg:flex-none">
                        <label htmlFor="tests-type" className={cn(dashboardPremium.labelClass, 'block')}>
                            Type
                        </label>
                        <select
                            id="tests-type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as '' | 'panel' | 'single')}
                            className={cn(dashboardPremium.selectClass, 'max-w-full')}
                        >
                            <option value="">All</option>
                            <option value="single">Single</option>
                            <option value="panel">Panel</option>
                        </select>
                    </div>
                    <div className="w-full min-w-0 space-y-2 lg:min-w-[10rem] lg:max-w-[14rem] lg:flex-none">
                        <label htmlFor="tests-department" className={cn(dashboardPremium.labelClass, 'block')}>
                            Department
                        </label>
                        <select
                            id="tests-department"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className={cn(dashboardPremium.selectClass, 'max-w-full')}
                        >
                            <option value="">All departments</option>
                            {departmentOptions.map((d) => (
                                <option key={d} value={d} className="capitalize">
                                    {departmentLabel(d)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
                        <label htmlFor="tests-sort" className={cn(dashboardPremium.labelClass, 'block')}>
                            Sort
                        </label>
                        <DashboardListSortControl
                            id="tests-sort"
                            labeledByParent
                            className="w-full lg:w-auto lg:shrink-0"
                            value={sortKey}
                            options={[
                                { value: 'testName', label: 'Test name' },
                                { value: 'testCode', label: 'Code' },
                                { value: 'department', label: 'Department' },
                                { value: 'sampleType', label: 'Sample' },
                                { value: 'type', label: 'Panel / single' },
                                { value: 'price', label: 'Price' },
                                { value: 'parameters', label: 'Parameters' },
                            ]}
                            onChange={setSortKey}
                            sortDir={sortDir}
                            onToggleDir={toggleSortDir}
                        />
                    </div>
                    <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
                        <span className={cn(dashboardPremium.labelClass, 'block')}>Export</span>
                        <div role="group" aria-label="Export loaded rows">
                            <DashboardDatasetExportActions
                                filePrefix="labcore-tests"
                                columns={exportColumns}
                                rows={exportRows}
                                className="lg:flex-nowrap"
                            />
                        </div>
                    </div>
                    <p
                        className="w-full shrink-0 text-xs leading-snug tabular-nums text-zinc-500 lg:w-auto lg:max-w-[12rem] lg:text-right"
                        aria-live="polite"
                    >
                        {loading
                            ? 'Loading…'
                            : `${sortedTests.length} test${sortedTests.length === 1 ? '' : 's'}${hasActiveFilters ? ' (filtered)' : ''}`}
                    </p>
                </div>
            </DashboardToolbarPanel>

            {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

            {loading ? (
                <DashboardListSkeleton rows={5} />
            ) : tests.length === 0 ? (
                <div className={cn(dashboardPremium.panelClass, 'px-6 py-14 text-center text-sm text-muted-foreground')}>
                    No tests found. Add a new test to get started.
                </div>
            ) : sortedTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-zinc-200 bg-card px-6 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                        <ActivitySquare className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-zinc-800">No tests match</p>
                    <p className="max-w-sm text-sm text-zinc-500">Try different filters or clear them.</p>
                    <button type="button" className={cn(dashboardPremium.ghostBtn, 'mt-1')} onClick={clearFilters}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <>
                    <ul className="space-y-3 md:hidden">
                        {sortedTests.map((test, i) => (
                            <li
                                key={test.id}
                                className={cn(
                                    dashboardPremium.panelClass,
                                    !test.isActive && 'opacity-50',
                                    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
                                )}
                                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start gap-2">
                                                <ActivitySquare
                                                    className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                                                    aria-hidden
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-base font-semibold leading-snug text-zinc-950">
                                                        {test.testName}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        {test.testCode ? (
                                                            <span className="font-authMono text-[0.7rem] font-medium uppercase tracking-wider text-teal-800">
                                                                {test.testCode}
                                                            </span>
                                                        ) : null}
                                                        {!test.isActive ? (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Inactive
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {test.isPanel ? (
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-50"
                                            >
                                                Panel
                                            </Badge>
                                        ) : (
                                            <span className="shrink-0 text-xs font-medium text-zinc-500">Single</span>
                                        )}
                                    </div>
                                    <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-zinc-400">Department</dt>
                                            <dd className="text-right font-medium capitalize text-zinc-800">
                                                {departmentLabel(test.department) || '—'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-zinc-400">Sample</dt>
                                            <dd className="text-right font-medium text-zinc-800">
                                                {test.sampleType || '—'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-zinc-400">Price</dt>
                                            <dd className="font-medium tabular-nums text-zinc-800">
                                                ₹{Number(test.price).toFixed(2)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-zinc-400">Parameters</dt>
                                            <dd className="font-medium tabular-nums text-zinc-800">
                                                {test.parameters.length}
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:flex-wrap">
                                        <Button variant="outline" size="sm" className="min-h-[44px] w-full justify-center sm:min-h-8 sm:w-auto">
                                            <Edit className="mr-2 h-4 w-4 text-gray-500" aria-hidden />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="min-h-[44px] w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:min-h-8 sm:w-auto"
                                            disabled={!test.isActive}
                                            onClick={() => deactivateTest(test.id)}
                                        >
                                            Deactivate
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div
                        className={cn(
                            'hidden overflow-hidden md:block',
                            dashboardPremium.panelClass,
                            'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-400 motion-safe:ease-out motion-reduce:animate-none',
                        )}
                    >
                        <Table className="min-w-[52rem]">
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
                                {sortedTests.map((test) => (
                                    <TableRow key={test.id} className={!test.isActive ? 'opacity-50' : ''}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <ActivitySquare className="mr-2 h-4 w-4 text-gray-400" />
                                                {test.testName}
                                                {!test.isActive && (
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{test.testCode || '-'}</TableCell>
                                        <TableCell className="capitalize">
                                            {departmentLabel(test.department) || '—'}
                                        </TableCell>
                                        <TableCell>{test.sampleType || '-'}</TableCell>
                                        <TableCell>
                                            {test.isPanel ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-50"
                                                >
                                                    Panel
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-zinc-500">Single</span>
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
                                                className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                disabled={!test.isActive}
                                                onClick={() => deactivateTest(test.id)}
                                            >
                                                Deactivate
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </DashboardPageScaffold>
    );
}
