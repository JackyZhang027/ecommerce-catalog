import React, { useRef } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';

const DEFAULT_color = '#181818';

interface SettingApp {
    app_name: string;
    shop_name: string;
    description: string;
    color: string;
    logo: string;
    favicon: string;
    seo: {
        title?: string;
        description?: string;
        keywords?: string;
    };
    whatsapp_number?: string;
    whatsapp_message_template?: string;
}

interface Props {
    setting: SettingApp | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '/admin/settingsapp' },
];

export default function SettingForm({ setting }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        app_name: setting?.app_name || '',
        description: setting?.description || '',
        color: setting?.color || '#0ea5e9',
        seo: {
            title: setting?.seo?.title || '',
            description: setting?.seo?.description || '',
            keywords: setting?.seo?.keywords || '',
        },
        logo: null as File | null,
        favicon: null as File | null,
        shop_name: setting?.shop_name || '',
        whatsapp_number: setting?.whatsapp_number || '',
        whatsapp_message_template: setting?.whatsapp_message_template || '',
    });

    const logoPreview = useRef<string | null>(setting?.logo ? `/storage/${setting.logo}` : null);
    const faviconPreview = useRef<string | null>(setting?.favicon ? `/storage/${setting.favicon}` : null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/settingsapp', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} title="Application Settings">
            <Head title="Application Settings" />
            <div className="flex-1 p-4 md:p-6">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold tracking-tight">Application Settings</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">Configure application identity, theme color, logo, and SEO metadata.</p>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nama App */}
                            <div className="space-y-1">
                                <Label htmlFor="app_name">Application Name</Label>
                                <Input
                                    id="app_name"
                                    value={data.app_name}
                                    onChange={(e) => setData('app_name', e.target.value)}
                                    className={errors.app_name ? 'border-red-500' : ''}
                                />
                                {errors.app_name && <p className="text-sm text-red-500">{errors.app_name}</p>}
                            </div>

                            {/* Shop Name */}
                            <div className="space-y-1">
                                <Label htmlFor="app_name">Shop Name</Label>
                                <Input
                                    id="shop_name"
                                    value={data.shop_name}
                                    onChange={(e) => setData('shop_name', e.target.value)}
                                    className={errors.shop_name ? 'border-red-500' : ''}
                                />
                                {errors.shop_name && <p className="text-sm text-red-500">{errors.shop_name}</p>}
                            </div>

                            {/* description */}
                            <div className="space-y-1">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </div>

                            {/* color Tema */}
                            <div className="space-y-1">
                                <Label htmlFor="color">Theme Color</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                        className="w-16 h-10 p-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setData('color', DEFAULT_color)}
                                    >
                                        Reset Default
                                    </Button>
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-1">
                                <Label htmlFor="logo">Logo (Max 2MB)</Label>
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setData('logo', file);
                                        if (file) logoPreview.current = URL.createObjectURL(file);
                                    }}
                                />
                                {logoPreview.current && (
                                    <img src={logoPreview.current} alt="Preview Logo" className="mt-2 h-16 rounded" />
                                )}
                            </div>

                            {/* Favicon Upload */}
                            <div className="space-y-1">
                                <Label htmlFor="favicon">Favicon (Max 1MB)</Label>
                                <Input
                                    id="favicon"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setData('favicon', file);
                                        if (file) faviconPreview.current = URL.createObjectURL(file);
                                    }}
                                />
                                {faviconPreview.current && (
                                    <img src={faviconPreview.current} alt="Preview Favicon" className="mt-2 h-10 rounded" />
                                )}
                            </div>

                            {/* SEO Section */}
                            <Separator />
                            <h3 className="text-lg font-semibold">SEO Settings</h3>

                            <div className="space-y-1">
                                <Label htmlFor="seo_title">SEO Title</Label>
                                <Input
                                    id="seo_title"
                                    value={data.seo.title}
                                    onChange={(e) => setData('seo', { ...data.seo, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="seo_description">SEO Description</Label>
                                <Textarea
                                    id="seo_description"
                                    value={data.seo.description}
                                    onChange={(e) => setData('seo', { ...data.seo, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="seo_keywords">SEO Keywords (separate with commas)</Label>
                                <Input
                                    id="seo_keywords"
                                    value={data.seo.keywords}
                                    onChange={(e) => setData('seo', { ...data.seo, keywords: e.target.value })}
                                />
                            </div>
                            <Separator />
                            <h3 className="text-lg font-semibold">WhatsApp Settings</h3>
                            <div className="space-y-1">
                                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                                <Input
                                    id="whatsapp_number"
                                    value={data.whatsapp_number}
                                    onChange={(e) => setData('whatsapp_number', e.target.value)}
                                    placeholder="e.g., 6281234567890"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="whatsapp_message_template">WhatsApp Message Template</Label>
                                <Textarea
                                    id="whatsapp_message_template"
                                    value={data.whatsapp_message_template}
                                    onChange={(e) => setData('whatsapp_message_template', e.target.value)}
                                    placeholder="e.g., Hello, I'm interested in buying *{product_name}*."
                                />
                            </div>


                            {/* Submit Button */}
                            <div className="pt-4 flex justify-end">
                                <Button type="submit" disabled={processing} className="px-6">
                                    {processing ? 'Saving...' : 'Save Settings'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}