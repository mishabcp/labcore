import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any | null;
    onSaved: () => void;
}

export function UserModal({ isOpen, onClose, user, onSaved }: UserModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [role, setRole] = useState('front_desk');
    const [qualification, setQualification] = useState('');
    const [registrationNo, setRegistrationNo] = useState('');
    // For new users only:
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setName(user.name);
                setEmail(user.email || '');
                setMobile(user.mobile);
                setRole(user.role);
                setQualification(user.qualification || '');
                setRegistrationNo(user.registrationNo || '');
            } else {
                setName('');
                setEmail('');
                setMobile('');
                setRole('front_desk');
                setQualification('');
                setRegistrationNo('');
            }
            setTempPassword('');
            setError(null);
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (user) {
                await api.patch(`/users/${user.id}`, {
                    name,
                    email: email || undefined,
                    mobile,
                    role,
                    qualification: qualification || undefined,
                    registrationNo: registrationNo || undefined,
                });
                onSaved();
                onClose();
            } else {
                const res = await api.post('/users', {
                    name,
                    email: email || undefined,
                    mobile,
                    role,
                    qualification: qualification || undefined,
                    registrationNo: registrationNo || undefined,
                });
                if (res.tempPassword) {
                    setTempPassword(res.tempPassword);
                    onSaved();
                } else {
                    onSaved();
                    onClose();
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (tempPassword) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>User Created Successfully</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4 text-center">
                        <p>Please share this temporary password with the user securely:</p>
                        <div className="text-2xl font-mono bg-muted p-4 rounded tracking-wider">
                            {tempPassword}
                        </div>
                        <p className="text-sm text-muted-foreground">They should change it after their first login.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={onClose}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>Full Name *</Label>
                            <Input required value={name} onChange={(e: any) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Mobile Number *</Label>
                            <Input required value={mobile} onChange={(e: any) => setMobile(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email (Optional)</Label>
                            <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Role *</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="pathologist">Pathologist</SelectItem>
                                    <SelectItem value="senior_tech">Senior Technician</SelectItem>
                                    <SelectItem value="technician">Technician</SelectItem>
                                    <SelectItem value="front_desk">Front Desk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(role === 'pathologist' || role === 'senior_tech' || role === 'technician') && (
                            <>
                                <div className="space-y-2">
                                    <Label>Qualification</Label>
                                    <Input value={qualification} onChange={(e: any) => setQualification(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Registration No.</Label>
                                    <Input value={registrationNo} onChange={(e: any) => setRegistrationNo(e.target.value)} />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save User'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
