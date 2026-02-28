import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any | null;
}

export function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTempPassword('');
            setError(null);
        }
    }, [isOpen]);

    const handleReset = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const res = await api.post(`/users/${user.id}/reset-password`, {});
            setTempPassword(res.tempPassword);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    {!tempPassword && (
                        <DialogDescription>
                            Are you sure you want to reset the password for <strong>{user.name}</strong>?
                        </DialogDescription>
                    )}
                </DialogHeader>

                {tempPassword ? (
                    <div className="py-6 space-y-4 text-center">
                        <p className="text-sm text-green-600 font-medium">Password reset successful!</p>
                        <p>Please share this new temporary password with the user securely:</p>
                        <div className="text-2xl font-mono bg-muted p-4 rounded tracking-wider">
                            {tempPassword}
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}

                        <div className="flex items-start space-x-3 bg-amber-50 text-amber-800 p-4 rounded-md">
                            <AlertTriangle className="h-5 w-5 mt-0.5" />
                            <div className="text-sm">
                                This will immediately invalidate their current password. They will need the new temporary password to log in.
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {tempPassword ? (
                        <Button onClick={onClose}>Done</Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                            <Button variant="destructive" onClick={handleReset} disabled={loading}>
                                {loading ? 'Resetting...' : 'Yes, Reset Password'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
