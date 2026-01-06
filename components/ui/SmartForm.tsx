import React, { useState, useEffect } from 'react';
import Button from './Button';
import Input from './Input';

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'email' | 'tel' | 'select' | 'checkbox' | 'textarea' | 'password';
    options?: { label: string; value: string | number }[];
    required?: boolean;
    placeholder?: string;
    className?: string; // Tailwind classes for grid layout e.g. "col-span-2"
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface SmartFormProps<T> {
    fields: FormField[];
    defaultValues?: Partial<T>;
    onSubmit: (data: T) => void;
    submitLabel?: string;
    isLoading?: boolean;
    columns?: 1 | 2 | 3 | 4;
}

function SmartForm<T extends Record<string, any>>({
    fields,
    defaultValues = {} as Partial<T>,
    onSubmit,
    submitLabel = "Guardar",
    isLoading = false,
    columns = 2
}: SmartFormProps<T>) {

    const [formData, setFormData] = useState<Partial<T>>(defaultValues);

    useEffect(() => {
        setFormData(defaultValues);
    }, [defaultValues]);

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData as T);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
                {fields.map((field) => {
                    const value = formData[field.name];

                    if (field.type === 'select') {
                        return (
                            <div key={field.name} className={`space-y-2 ${field.className || ''}`}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    {field.icon && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            {field.icon}
                                        </div>
                                    )}
                                    <select
                                        value={value !== undefined ? value : ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        disabled={field.disabled}
                                        className={`w-full ${field.icon ? 'pl-11' : 'px-4'} py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase disabled:opacity-50`}
                                        required={field.required}
                                    >
                                        <option value="">SELECCIONAR...</option>
                                        {field.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    }

                    if (field.type === 'textarea') {
                        return (
                            <div key={field.name} className={`space-y-2 ${field.className || ''}`}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={value !== undefined ? value : ''}
                                    onChange={(e) => handleChange(field.name, e.target.value.toUpperCase())}
                                    disabled={field.disabled}
                                    placeholder={field.placeholder}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24"
                                    required={field.required}
                                />
                            </div>
                        );
                    }

                    if (field.type === 'checkbox') {
                        return (
                            <div key={field.name} className={`flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 ${field.className || ''}`}>
                                <input
                                    type="checkbox"
                                    id={`field-${field.name}`}
                                    checked={!!value}
                                    onChange={(e) => handleChange(field.name, e.target.checked)}
                                    className="w-5 h-5 accent-blue-600 rounded"
                                    disabled={field.disabled}
                                />
                                <label htmlFor={`field-${field.name}`} className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                                    {field.label}
                                </label>
                            </div>
                        );
                    }

                    return (
                        <div key={field.name} className={field.className}>
                            <Input
                                label={field.label}
                                type={field.type}
                                value={value !== undefined ? value : ''}
                                onChange={(e) => handleChange(field.name, field.type === 'email' ? e.target.value : e.target.value.toUpperCase())} // Emails usually lower, others upper per app style
                                placeholder={field.placeholder}
                                icon={field.icon}
                                required={field.required}
                                disabled={field.disabled}
                                className={field.type !== 'date' ? 'uppercase' : ''}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="px-8 shadow-xl uppercase tracking-widest text-xs"
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

export default SmartForm;
