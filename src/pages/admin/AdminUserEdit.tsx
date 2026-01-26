import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Ban, Save} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {usersApi} from '@/services/api';

interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
}

export default function AdminUserEdit() {
    const {userId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        username: '',
    });

    useEffect(() => {
        document.title = 'Foydalanuvchini tahrirlash | Abdiyev School';
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', "Admin uchun foydalanuvchi ma'lumotlarini tahrirlash sahifasi.");
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const res = await usersApi.getById(userId);
                setUser(res);
                setForm({
                    first_name: res.first_name || '',
                    last_name: res.last_name || '',
                    email: res.email || '',
                    phone: res.phone || '',
                    username: res.username || '',
                });
            } catch (e) {
                toast({
                    title: 'Xatolik',
                    description: "Foydalanuvchi ma'lumotlarini yuklab bo'lmadi",
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId, toast]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            await usersApi.update(userId, form);
            toast({title: 'Muvaffaqiyat', description: "Foydalanuvchi yangilandi"});
            navigate(`/admin/users/${userId}`);
        } catch (e) {
            toast({
                title: 'Xatolik',
                description: "Saqlashda xatolik",
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <header className="mb-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Orqaga
                </Button>
            </header>

            <main>
                <section className="w-full">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                        Foydalanuvchini tahrirlash
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        {user ? `${user.first_name || user.username} ${user.last_name || ''}` : "Ma'lumotlar"}
                    </p>

                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        {loading ? (
                            <div className="text-muted-foreground">Yuklanmoqda...</div>
                        ) : !user ? (
                            <div className="text-muted-foreground">Foydalanuvchi topilmadi</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">Ism</Label>
                                        <Input
                                            id="first_name"
                                            value={form.first_name}
                                            onChange={(e) => setForm((p) => ({...p, first_name: e.target.value}))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Familiya</Label>
                                        <Input
                                            id="last_name"
                                            value={form.last_name}
                                            onChange={(e) => setForm((p) => ({...p, last_name: e.target.value}))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={form.username}
                                        disabled={true}
                                        onChange={(e) => setForm((p) => ({...p, username: e.target.value}))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefon</Label>
                                    <Input
                                        id="phone"
                                        value={form.phone}
                                        onChange={(e) => setForm((p) => ({...p, phone: e.target.value}))}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={handleSave}
                                        className="gradient-primary text-primary-foreground"
                                        disabled={saving}
                                    >
                                        <Save className="mr-2 h-4 w-4"/>
                                        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                                    </Button>
                                    <Button variant="outline" className="hover:bg-destructive"
                                            onClick={() => navigate(`/admin/users/${userId}`)}>
                                        <Ban/>
                                        Bekor qilish
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </main>
        </DashboardLayout>
    );
}
