'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

function RichTextEditor({ value, onChange, disabled, resultId }: { value: string, onChange: (val: string) => void, disabled: boolean, resultId: string }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: true, allowBase64: true })
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    const attachImage = useCallback(async () => {
        if (!editor || disabled) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const formData = new FormData();
                formData.append('file', file);

                const token = getToken();
                if (!token) return;
                try {
                    // Add image attachment api
                    const res = await fetch(`${API_URL}/results/${resultId}/attachments`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                    });
                    const data = await res.json();
                    if (res.ok && data.url) {
                        editor.chain().focus().setImage({ src: data.url }).run();
                    } else {
                        // fallback: allow Base64 if API not fully ready
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            editor.chain().focus().setImage({ src: e.target?.result as string }).run();
                        };
                        reader.readAsDataURL(file);
                    }
                } catch (e) {
                    // fallback
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        editor.chain().focus().setImage({ src: ev.target?.result as string }).run();
                    };
                    reader.readAsDataURL(file);
                }
            }
        };
        input.click();
    }, [editor, disabled, resultId]);

    if (!editor) return null;

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
            {!disabled && (
                <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 bg-gray-50">
                    <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-gray-200 font-bold' : 'hover:bg-gray-200'}`}><b>B</b></button>
                    <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-gray-200 font-bold' : 'hover:bg-gray-200'}`}><i>I</i></button>
                    <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('strike') ? 'bg-gray-200 font-bold' : 'hover:bg-gray-200'}`}><s>S</s></button>
                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                    <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 font-bold' : 'hover:bg-gray-200'}`}>H2</button>
                    <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 font-bold' : 'hover:bg-gray-200'}`}>H3</button>
                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                    <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-gray-200 font-bold' : 'hover:bg-gray-200'}`}>• List</button>
                    <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-gray-200 font-bold' : 'hover:bg-gray-200'}`}>1. List</button>
                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                    <button type="button" onClick={attachImage} className="px-2 py-1 text-sm rounded hover:bg-gray-200">🖼️ Image</button>
                </div>
            )}
            <div className="p-4 prose max-w-none min-h-[300px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

export default function NarrativeResultPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [result, setResult] = useState<any | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = getToken();
        if (!token || !id) return;
        fetch(`${API_URL}/results/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                setResult(data);
                if (data?.resultValues) {
                    const v: Record<string, string> = {};
                    data.resultValues.forEach((rv: any) => {
                        if (rv.testParameter?.resultType === 'text') {
                            v[rv.testParameterId] = rv.textValue ?? '';
                        }
                    });
                    setValues(v);
                }
            });
    }, [id]);

    async function handleSave() {
        const token = getToken();
        if (!token || !result) return;

        // We only update the 'text' parameters in this narrative view
        const textParameters = result.orderItem?.testDefinition?.parameters?.filter((p: any) => p.resultType === 'text') ?? [];

        setSaving(true);
        setMessage('');
        try {
            const payloadValues = textParameters.map((p: any) => {
                return { testParameterId: p.id, textValue: values[p.id] || undefined };
            });

            const res = await fetch(`${API_URL}/results/${id}/values`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ values: payloadValues }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Failed to save narrative.');

            setMessage('Narrative saved successfully.');
            setTimeout(() => {
                setMessage('');
                router.push(`/dashboard/results/${id}`);
            }, 1500);
        } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Failed');
        } finally {
            setSaving(false);
        }
    }

    if (!result) {
        return (
            <div className="max-w-4xl">
                <Link href={`/dashboard/results/${id}`} className="text-sm text-gray-600 hover:underline">← Back to Result</Link>
                <p className="mt-4 text-gray-500">Loading…</p>
            </div>
        );
    }

    const textParameters = result.orderItem?.testDefinition?.parameters?.filter((p: any) => p.resultType === 'text') ?? [];
    const isReadOnly = result.status === 'authorised';

    return (
        <div className="max-w-5xl">
            <div className="mb-6">
                <Link href={`/dashboard/results/${id}`} className="text-sm text-blue-600 hover:underline font-medium">← Back to Result Entry</Link>
                <div className="flex justify-between items-end mt-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{result.orderItem?.testDefinition?.testName} (Narrative)</h1>
                        <p className="text-sm text-gray-500 mt-1">Patient: <span className="font-medium text-gray-900">{result.orderItem?.order?.patient?.name}</span> · Status: <span className="font-medium text-gray-900 capitalize">{result.status}</span></p>
                    </div>
                </div>
            </div>

            {textParameters.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
                    <p>This test does not contain any free-text/narrative parameters.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {textParameters.map((p: any) => (
                        <div key={p.id} className="rounded-lg shadow-sm border border-gray-200 bg-white p-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-lg font-medium text-gray-900">{p.paramName}</label>
                            </div>
                            <RichTextEditor
                                value={values[p.id] || ''}
                                onChange={(val) => setValues(prev => ({ ...prev, [p.id]: val }))}
                                disabled={isReadOnly}
                                resultId={result.id}
                            />
                        </div>
                    ))}

                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm">
                            {message && <span className={message.includes('successfully') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{message}</span>}
                        </div>

                        {(result.status === 'pending' || result.status === 'entered') && (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full sm:w-auto rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save Narrative'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
