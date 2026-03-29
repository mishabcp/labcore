'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Ban, ShieldAlert, User as UserIcon, Users } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { UserModal } from './components/user-modal';
import { ResetPasswordModal } from './components/reset-password-modal';
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

interface User {
    id: string;
    name: string;
    email: string | null;
    mobile: string;
    role: string;
    qualification: string | null;
    registrationNo: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

const USER_ROLES = ['admin', 'pathologist', 'senior_tech', 'technician', 'front_desk'] as const;

type SortKey = 'name' | 'role' | 'email' | 'createdAt' | 'lastLoginAt' | 'status';

function roleLabel(role: string) {
    return role.replace(/_/g, ' ');
}

const exportColumns: { key: string; header: string }[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    { key: 'role', header: 'Role' },
    { key: 'qualification', header: 'Qualification' },
    { key: 'registrationNo', header: 'Registration' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Added' },
    { key: 'lastLoginAt', header: 'Last login' },
];

export default function UsersPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebouncedValue(searchInput);
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.get('/users');
            setUsers(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load users';
            setError(message);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const needle = debouncedSearch.toLowerCase();

    const filteredUsers = useMemo(() => {
        let list = users;
        if (roleFilter) {
            list = list.filter((u) => u.role === roleFilter);
        }
        if (statusFilter === 'active') {
            list = list.filter((u) => u.isActive);
        }
        if (statusFilter === 'inactive') {
            list = list.filter((u) => !u.isActive);
        }
        if (!needle) return list;
        return list.filter((u) => {
            const blob = [
                u.name,
                u.email,
                u.mobile,
                u.role,
                roleLabel(u.role),
                u.qualification,
                u.registrationNo,
                u.isActive ? 'active' : 'inactive',
                formatDate(u.createdAt),
                u.lastLoginAt ? formatDate(u.lastLoginAt) : '',
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return blob.includes(needle);
        });
    }, [users, roleFilter, statusFilter, needle]);

    const sortedUsers = useMemo(() => {
        const list = [...filteredUsers];
        const dir = sortDir === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            if (sortKey === 'role') {
                return roleLabel(a.role).localeCompare(roleLabel(b.role), undefined, { sensitivity: 'base' }) * dir;
            }
            if (sortKey === 'email') {
                return (a.email ?? '').localeCompare(b.email ?? '', undefined, { sensitivity: 'base' }) * dir;
            }
            if (sortKey === 'createdAt') {
                const ta = new Date(a.createdAt).getTime();
                const tb = new Date(b.createdAt).getTime();
                return (ta - tb) * dir;
            }
            if (sortKey === 'lastLoginAt') {
                const ta = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
                const tb = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
                return (ta - tb) * dir;
            }
            if (sortKey === 'status') {
                return (Number(a.isActive) - Number(b.isActive)) * dir;
            }
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) * dir;
        });
        return list;
    }, [filteredUsers, sortKey, sortDir]);

    const exportRows = useMemo(
        () =>
            sortedUsers.map((u) => ({
                name: u.name,
                email: u.email ?? '',
                mobile: u.mobile,
                role: roleLabel(u.role),
                qualification: u.qualification ?? '',
                registrationNo: u.registrationNo ?? '',
                status: u.isActive ? 'Active' : 'Inactive',
                createdAt: formatDate(u.createdAt),
                lastLoginAt: u.lastLoginAt ? formatDate(u.lastLoginAt) : '—',
            })),
        [sortedUsers],
    );

    const toggleSortDir = useCallback(() => {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }, []);

    const hasActiveFilters = Boolean(needle || roleFilter || statusFilter);

    const clearFilters = useCallback(() => {
        setSearchInput('');
        setRoleFilter('');
        setStatusFilter('');
    }, []);

    const handleDeactivate = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this user? They will no longer be able to log in.')) return;
        try {
            await api.patch(`/users/${id}/deactivate`);
            fetchUsers();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to deactivate user';
            alert(message);
        }
    };

    return (
        <DashboardPageScaffold>
            <DashboardPageHeader
                eyebrow={t('nav.settings')}
                title={t('settings.users')}
                subtitle="Search, filter by role and status, sort, and export. Edit, reset password, or deactivate staff."
                compact
                action={
                    <Button
                        className="w-full shrink-0 sm:w-auto"
                        onClick={() => {
                            setSelectedUser(null);
                            setIsUserModalOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> {t('common.add')}
                    </Button>
                }
            />

            <DashboardToolbarPanel className="min-w-0">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-3 lg:overflow-x-auto lg:overscroll-x-contain lg:pb-0.5 [-webkit-overflow-scrolling:touch]">
                    <div className="min-w-0 flex-1 space-y-2 lg:min-w-[min(100%,12rem)]">
                        <label htmlFor="users-search" className={cn(dashboardPremium.labelClass, 'block')}>
                            Search
                        </label>
                        <DashboardListSearchField
                            id="users-search"
                            value={searchInput}
                            onChange={setSearchInput}
                            placeholder="Name, email, mobile, role…"
                        />
                    </div>
                    <div className="w-full min-w-0 space-y-2 lg:w-44 lg:flex-none">
                        <label htmlFor="users-role" className={cn(dashboardPremium.labelClass, 'block')}>
                            Role
                        </label>
                        <select
                            id="users-role"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className={cn(dashboardPremium.selectClass, 'max-w-full')}
                        >
                            <option value="">All roles</option>
                            {USER_ROLES.map((r) => (
                                <option key={r} value={r} className="capitalize">
                                    {roleLabel(r)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full min-w-0 space-y-2 lg:w-40 lg:flex-none">
                        <label htmlFor="users-status" className={cn(dashboardPremium.labelClass, 'block')}>
                            Status
                        </label>
                        <select
                            id="users-status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
                            className={cn(dashboardPremium.selectClass, 'max-w-full')}
                        >
                            <option value="">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="min-w-0 space-y-2 lg:w-auto lg:flex-none">
                        <label htmlFor="users-sort" className={cn(dashboardPremium.labelClass, 'block')}>
                            Sort
                        </label>
                        <DashboardListSortControl
                            id="users-sort"
                            labeledByParent
                            className="w-full lg:w-auto lg:shrink-0"
                            value={sortKey}
                            options={[
                                { value: 'name', label: 'Name' },
                                { value: 'role', label: 'Role' },
                                { value: 'email', label: 'Email' },
                                { value: 'createdAt', label: 'Added date' },
                                { value: 'lastLoginAt', label: 'Last login' },
                                { value: 'status', label: 'Status' },
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
                                filePrefix="labcore-users"
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
                            : `${sortedUsers.length} user${sortedUsers.length === 1 ? '' : 's'}${hasActiveFilters ? ' (filtered)' : ''}`}
                    </p>
                </div>
            </DashboardToolbarPanel>

            {error ? <DashboardErrorBanner>{error}</DashboardErrorBanner> : null}

            {loading ? (
                <DashboardListSkeleton rows={5} />
            ) : users.length === 0 ? (
                <div className="rounded-md border border-zinc-200 bg-card px-6 py-14 text-center text-sm text-muted-foreground">
                    No users found
                </div>
            ) : sortedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-zinc-200 bg-card px-6 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                        <Users className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-zinc-800">No users match</p>
                    <p className="max-w-sm text-sm text-zinc-500">Try different filters or clear them.</p>
                    <button type="button" className={cn(dashboardPremium.ghostBtn, 'mt-1')} onClick={clearFilters}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <>
                    <ul className="space-y-3 md:hidden">
                        {sortedUsers.map((user, i) => (
                            <li
                                key={user.id}
                                className={cn(
                                    dashboardPremium.panelClass,
                                    !user.isActive && 'opacity-60',
                                    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both motion-reduce:animate-none',
                                )}
                                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start gap-2">
                                                <UserIcon
                                                    className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                                                    aria-hidden
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-base font-semibold leading-snug text-zinc-950">
                                                        {user.name}
                                                    </p>
                                                    {user.qualification ? (
                                                        <p className="mt-0.5 text-xs text-zinc-500">{user.qualification}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                        {user.isActive ? (
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 border-green-500 bg-green-50 text-green-600"
                                            >
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 border-red-500 bg-red-50 text-red-600"
                                            >
                                                Inactive
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <Badge
                                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                                            className="capitalize"
                                        >
                                            {roleLabel(user.role)}
                                        </Badge>
                                    </div>
                                    <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-zinc-400">Mobile</dt>
                                            <dd className="text-right font-medium text-zinc-800">{user.mobile}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-zinc-400">Email</dt>
                                            <dd className="min-w-0 truncate text-right font-medium text-zinc-800">
                                                {user.email || '—'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-zinc-400">Added</dt>
                                            <dd className="font-authMono text-xs text-zinc-700">
                                                {formatDate(user.createdAt)}
                                            </dd>
                                        </div>
                                        {user.lastLoginAt ? (
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-zinc-400">Last login</dt>
                                                <dd className="font-authMono text-xs text-zinc-700">
                                                    {formatDate(user.lastLoginAt)}
                                                </dd>
                                            </div>
                                        ) : null}
                                    </dl>
                                    <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:flex-wrap">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="min-h-[44px] w-full justify-center sm:min-h-8 sm:w-auto"
                                            disabled={!user.isActive}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsUserModalOpen(true);
                                            }}
                                        >
                                            <Edit2 className="mr-2 h-4 w-4" aria-hidden />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="min-h-[44px] w-full justify-center sm:min-h-8 sm:w-auto"
                                            disabled={!user.isActive}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsResetModalOpen(true);
                                            }}
                                        >
                                            <ShieldAlert className="mr-2 h-4 w-4" aria-hidden />
                                            Reset password
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="min-h-[44px] w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:min-h-8 sm:w-auto"
                                            disabled={!user.isActive}
                                            onClick={() => handleDeactivate(user.id)}
                                        >
                                            <Ban className="mr-2 h-4 w-4" aria-hidden />
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
                        <Table className="min-w-[44rem]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Added On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedUsers.map((user) => (
                                    <TableRow key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                            {user.qualification && (
                                                <div className="text-xs text-muted-foreground">{user.qualification}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                                className="capitalize"
                                            >
                                                {roleLabel(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>{user.mobile}</div>
                                            <div className="text-xs text-muted-foreground">{user.email || '-'}</div>
                                        </TableCell>
                                        <TableCell>
                                            {user.isActive ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-green-500 bg-green-50 text-green-600"
                                                >
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-red-500 bg-red-50 text-red-600">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                                        <TableCell className="space-x-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsUserModalOpen(true);
                                                }}
                                                disabled={!user.isActive}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsResetModalOpen(true);
                                                }}
                                                disabled={!user.isActive}
                                                title="Reset Password"
                                            >
                                                <ShieldAlert className="h-4 w-4" />
                                                <span className="sr-only">Reset password</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleDeactivate(user.id)}
                                                disabled={!user.isActive}
                                            >
                                                <Ban className="h-4 w-4" />
                                                <span className="sr-only">Deactivate</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                user={selectedUser}
                onSaved={fetchUsers}
            />

            <ResetPasswordModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                user={selectedUser}
            />
        </DashboardPageScaffold>
    );
}
