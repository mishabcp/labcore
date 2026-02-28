'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, Edit2, Ban, ShieldAlert } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { UserModal } from './components/user-modal';
import { ResetPasswordModal } from './components/reset-password-modal';

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

export default function UsersPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.get('/users');
            setUsers(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeactivate = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this user? They will no longer be able to log in.')) return;
        try {
            await api.patch(`/users/${id}/deactivate`);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to deactivate user');
        }
    };

    if (loading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('settings.users')}</h1>
                    <p className="text-muted-foreground">
                        Manage lab access, roles, and staff details.
                    </p>
                </div>
                <Button onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> {t('common.add')}
                </Button>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center">
                    <ShieldAlert className="h-5 w-5 mr-2" />
                    {error}
                </div>
            )}

            <div className="rounded-md border bg-card">
                <Table>
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
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.name}
                                        {user.qualification && (
                                            <div className="text-xs text-muted-foreground">{user.qualification}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                            {user.role.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div>{user.mobile}</div>
                                        <div className="text-xs text-muted-foreground">{user.email || '-'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {user.isActive ? (
                                            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Active</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }}
                                            disabled={!user.isActive}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                                            disabled={!user.isActive}
                                            title="Reset Password"
                                        >
                                            <ShieldAlert className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeactivate(user.id)}
                                            disabled={!user.isActive}
                                        >
                                            <Ban className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

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
        </div>
    );
}
