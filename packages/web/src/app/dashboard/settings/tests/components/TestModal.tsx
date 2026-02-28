'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2 } from 'lucide-react';

interface Parameter {
    id?: string;
    name: string;
    unit: string;
    resultType: string;
    referenceRange: string;
    minValue?: number;
    maxValue?: number;
}

interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    test: any | null;
}

export function TestModal({ isOpen, onClose, onSave, test }: TestModalProps) {
    const [testName, setTestName] = useState('');
    const [testCode, setTestCode] = useState('');
    const [department, setDepartment] = useState('');
    const [sampleType, setSampleType] = useState('');
    const [isPanel, setIsPanel] = useState('false');
    const [price, setPrice] = useState('');
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (test) {
            setTestName(test.testName || '');
            setTestCode(test.testCode || '');
            setDepartment(test.department || '');
            setSampleType(test.sampleType || '');
            setIsPanel(test.isPanel ? 'true' : 'false');
            setPrice(test.price?.toString() || '0');
            setParameters(test.parameters?.map((p: any) => ({
                id: p.id,
                name: p.name,
                unit: p.unit || '',
                resultType: p.resultType || 'numeric',
                referenceRange: p.referenceRange || '',
            })) || []);
        } else {
            setTestName('');
            setTestCode('');
            setDepartment('');
            setSampleType('');
            setIsPanel('false');
            setPrice('');
            setParameters([]);
        }
        setError(null);
    }, [test, isOpen]);

    const handleAddParameter = () => {
        setParameters([...parameters, { name: '', unit: '', resultType: 'numeric', referenceRange: '' }]);
    };

    const handleRemoveParameter = (index: number) => {
        setParameters(parameters.filter((_, i) => i !== index));
    };

    const updateParameter = (index: number, field: keyof Parameter, value: string) => {
        const newParams = [...parameters];
        newParams[index] = { ...newParams[index], [field]: value };
        setParameters(newParams);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            testName,
            testCode,
            department,
            sampleType,
            isPanel: isPanel === 'true',
            price: parseFloat(price) || 0,
        };

        try {
            let testId = test?.id;

            // Save Test Details
            if (testId) {
                await api.patch(`/tests/${testId}`, payload);
            } else {
                const newTest = await api.post('/tests', payload);
                testId = newTest.id;
            }

            // Save Parameters
            // Currently simplified: adding new params, won't delete existing ones here yet to keep it brief
            for (const p of parameters) {
                const paramPayload = {
                    name: p.name,
                    unit: p.unit,
                    resultType: p.resultType,
                    referenceRange: p.referenceRange,
                };

                if (p.id) {
                    await api.patch(`/tests/${testId}/parameters/${p.id}`, paramPayload);
                } else if (p.name) {
                    await api.post(`/tests/${testId}/parameters`, paramPayload);
                }
            }

            onSave();
        } catch (err: any) {
            setError(err.message || 'Failed to save test details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{test ? 'Edit Test' : 'Add New Test'}</DialogTitle>
                </DialogHeader>

                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>Test Name *</Label>
                            <Input required value={testName} onChange={(e: any) => setTestName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Test Code</Label>
                            <Input value={testCode} onChange={(e: any) => setTestCode(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                                    <SelectItem value="Haematology">Haematology</SelectItem>
                                    <SelectItem value="Microbiology">Microbiology</SelectItem>
                                    <SelectItem value="Pathology">Pathology</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Sample Type</Label>
                            <Select value={sampleType} onValueChange={setSampleType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Sample Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Blood - Serum">Blood - Serum</SelectItem>
                                    <SelectItem value="Blood - EDTA">Blood - EDTA</SelectItem>
                                    <SelectItem value="Urine">Urine</SelectItem>
                                    <SelectItem value="Swab">Swab</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Test Type</Label>
                            <Select value={isPanel} onValueChange={setIsPanel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false">Single Test</SelectItem>
                                    <SelectItem value="true">Panel (Group of tests)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Base Price (₹)</Label>
                            <Input type="number" min="0" step="0.01" required value={price} onChange={(e: any) => setPrice(e.target.value)} />
                        </div>
                    </div>

                    {!isPanel && (
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <h4 className="font-medium text-sm">Test Parameters</h4>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddParameter}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Parameter
                                </Button>
                            </div>

                            {parameters.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No parameters defined. Result entry requires at least one parameter.</p>
                            ) : (
                                <div className="space-y-3">
                                    {parameters.map((param, index) => (
                                        <div key={index} className="flex gap-2 items-start bg-white p-3 border rounded shadow-sm">
                                            <div className="grid grid-cols-12 gap-2 flex-grow">
                                                <div className="col-span-4 space-y-1">
                                                    <Label className="text-xs">Parameter Name</Label>
                                                    <Input required value={param.name} onChange={(e: any) => updateParameter(index, 'name', e.target.value)} placeholder="e.g. Haemoglobin" className="h-8 text-sm" />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs">Unit</Label>
                                                    <Input value={param.unit} onChange={(e: any) => updateParameter(index, 'unit', e.target.value)} placeholder="g/dL" className="h-8 text-sm" />
                                                </div>
                                                <div className="col-span-3 space-y-1">
                                                    <Label className="text-xs">Format</Label>
                                                    <Select value={param.resultType} onValueChange={(v: any) => updateParameter(index, 'resultType', v)}>
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="numeric">Numeric</SelectItem>
                                                            <SelectItem value="qualitative">Text/Options</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-3 space-y-1">
                                                    <Label className="text-xs">Ref. Range text</Label>
                                                    <Input value={param.referenceRange} onChange={(e: any) => updateParameter(index, 'referenceRange', e.target.value)} placeholder="12.0 - 15.0" className="h-8 text-sm" />
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveParameter(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Test'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
