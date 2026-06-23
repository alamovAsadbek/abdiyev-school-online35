import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Save, Layers} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {modulesApi, categoriesApi} from '@/services/api';

export default function AdminModuleEdit() {
    const {categoryId, moduleId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '' as string,
        order: 0,
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [mod, cat] = await Promise.all([
                    modulesApi.getById(moduleId!),
                    categoryId ? categoriesApi.getById(categoryId) : Promise.resolve(null),
                ]);
                setForm({
                    name: mod?.name || '',
                    description: mod?.description || '',
                    price: mod?.price != null ? String(mod.price) : '',
                    order: mod?.order ?? 0,
                });
                if (cat) setCategoryName(cat.name || '');
            } catch (e) {
                toast({title: 'Xatolik', description: "Modulni yuklab bo'lmadi", variant: 'destructive'});
            } finally {
                setLoading(false);
            }
        };
        if (moduleId) load();
    }, [moduleId, categoryId, toast]);

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast({title: 'Xatolik', description: 'Modul nomini kiriting', variant: 'destructive'});
            return;
        }
        setSaving(true);
        try {
            await modulesApi.update(moduleId!, {
                name: form.name,
                description: form.description,
                price: form.price ? parseFloat(form.price) : null,
                order: form.order,
                category: categoryId,
            });
            toast({title: 'Muvaffaqiyat', description: 'Modul saqlandi'});
            navigate(`/admin/categories/${categoryId}`);
        } catch (e) {
            toast({title: 'Xatolik', description: 'Saqlashda xatolik', variant: 'destructive'});
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4"/> Orqaga
            </Button>

            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Layers className="h-6 w-6"/>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Modulni tahrirlash</h1>
                    {categoryName && <p className="text-muted-foreground text-sm">{categoryName}</p>}
                </div>
            </div>

            <div className="w-full space-y-5 rounded-xl border border-border bg-card p-6">
                <div>
                    <Label htmlFor="m-name">Modul nomi *</Label>
                    <Input
                        id="m-name"
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        placeholder="Masalan, Asoslar"
                    />
                </div>

                <div>
                    <Label htmlFor="m-desc">Tavsif</Label>
                    <Textarea
                        id="m-desc"
                        value={form.description}
                        onChange={(e) => setForm({...form, description: e.target.value})}
                        rows={4}
                        placeholder="Modul haqida qisqacha"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="m-price">Narxi (so'm)</Label>
                        <Input
                            id="m-price"
                            type="number"
                            min="0"
                            value={form.price}
                            onChange={(e) => setForm({...form, price: e.target.value})}
                            placeholder="0 - bepul"
                        />
                        <p className="text-xs text-muted-foreground mt-1">0 yoki bo'sh = bepul modul (hammaga ochiq)</p>
                    </div>
                    <div>
                        <Label htmlFor="m-order">Tartib</Label>
                        <Input
                            id="m-order"
                            type="number"
                            value={form.order}
                            onChange={(e) => setForm({...form, order: parseInt(e.target.value || '0', 10)})}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Bekor qilish</Button>
                    <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
                        <Save className="mr-2 h-4 w-4"/>
                        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
