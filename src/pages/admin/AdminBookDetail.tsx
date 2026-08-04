import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    ArrowLeft, Eye, Download, Gift, Users, Pencil, BookOpen,
    Trash2, X, Search, UserPlus, Maximize2, Lock
} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {booksApi, usersApi, userBooksApi} from '@/services/api';
import {formatDate} from '@/lib/utils';

const getFileType = (url?: string | null): 'image' | 'pdf' | 'other' | null => {
    if (!url) return null;
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
};

export default function AdminBookDetail() {
    const {bookId} = useParams();
    const navigate = useNavigate();
    const {toast} = useToast();

    const [book, setBook] = useState<any>(null);
    const [viewers, setViewers] = useState<any[]>([]);
    const [giftedUsers, setGiftedUsers] = useState<any[]>([]);
    const [userListType, setUserListType] = useState<'viewers' | 'gifted'>('viewers');
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showFileFullscreen, setShowFileFullscreen] = useState(false);

    // Grant modal state
    const [showGrantPanel, setShowGrantPanel] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [grantLoading, setGrantLoading] = useState(false);

    // Revoke confirm state
    const [revokeTarget, setRevokeTarget] = useState<any>(null);

    const loadAll = () => {
        if (!bookId) return;
        setLoading(true);
        Promise.all([
            booksApi.getById(bookId),
            booksApi.getViewers(bookId),
            booksApi.getGiftedUsers(bookId),
        ])
            .then(([bookRes, viewersRes, giftedRes]) => {
                setBook(bookRes);
                setViewers(Array.isArray(viewersRes) ? viewersRes : []);
                setGiftedUsers(Array.isArray(giftedRes) ? giftedRes : []);
            })
            .catch(() => {
                toast({title: 'Xatolik', description: 'Ma\'lumotlarni yuklashda xatolik', variant: 'destructive'});
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadAll();
    }, [bookId]);

    const handleToggleActive = async (checked: boolean) => {
        try {
            const fd = new FormData();
            fd.append('is_active', String(checked));
            await booksApi.update(bookId!, fd);
            setBook((prev: any) => ({...prev, is_active: checked}));
            toast({title: 'Muvaffaqiyat', description: checked ? 'Kitob faollashtirildi' : 'Kitob nofaol qilindi'});
        } catch {
            toast({title: 'Xatolik', description: 'Holatni o\'zgartirishda xatolik', variant: 'destructive'});
        }
    };

    const handleDelete = async () => {
        try {
            await booksApi.delete(bookId!);
            toast({title: 'O\'chirildi', description: 'Kitob o\'chirildi'});
            navigate('/admin/library');
        } catch {
            toast({title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive'});
        }
    };

    const openGrantPanel = () => {
        setShowGrantPanel(true);
        setSelectedUserIds([]);
        usersApi.getAll()
            .then((res: any) => setAllUsers(res?.results || res || []))
            .catch(() => toast({title: 'Xatolik', description: 'Userlarni yuklashda xatolik', variant: 'destructive'}));
    };

    const toggleUserSelect = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleGrantSubmit = async () => {
        if (selectedUserIds.length === 0) {
            toast({title: 'Xatolik', description: 'Kamida 1 ta foydalanuvchi tanlang', variant: 'destructive'});
            return;
        }
        setGrantLoading(true);
        try {
            await userBooksApi.grantBook(bookId!, selectedUserIds, 'gift');
            toast({title: 'Muvaffaqiyat', description: `${selectedUserIds.length} ta foydalanuvchiga kitob berildi`});
            setShowGrantPanel(false);
            loadAll();
        } catch {
            toast({title: 'Xatolik', description: 'Berishda xatolik', variant: 'destructive'});
        } finally {
            setGrantLoading(false);
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        try {
            await userBooksApi.revoke(revokeTarget.id);
            toast({title: 'Bekor qilindi', description: `${revokeTarget.user_name} uchun huquq qaytarib olindi`});
            setGiftedUsers(prev => prev.filter(g => g.id !== revokeTarget.id));
        } catch {
            toast({title: 'Xatolik', description: 'Qaytarib olishda xatolik', variant: 'destructive'});
        } finally {
            setRevokeTarget(null);
        }
    };

    const filteredUsersForGrant = allUsers.filter(u => {
        const already = giftedUsers.some(g => String(g.user) === String(u.id));
        if (already) return false;
        if (!userSearch) return true;
        const q = userSearch.toLowerCase();
        return u.username?.toLowerCase().includes(q) ||
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
    });

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                </div>
            </DashboardLayout>
        );
    }

    if (!book) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground mb-4">Kitob topilmadi</p>
                    <Button onClick={() => navigate('/admin/library')}>Orqaga qaytish</Button>
                </div>
            </DashboardLayout>
        );
    }

    const currentList = userListType === 'viewers' ? viewers : giftedUsers;
    const fileType = getFileType(book.file_url);

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/admin/library')} className="-ml-2">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Orqaga
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}
                            className="text-destructive hover:bg-destructive hover:text-white">
                        <Trash2 className="mr-2 h-4 w-4"/>
                        O'chirish
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/admin/library/${bookId}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4"/>
                        Tahrirlash
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
                    <TabsTrigger value="info">Kitob haqida</TabsTrigger>
                    <TabsTrigger value="users">Foydalanuvchilar</TabsTrigger>
                </TabsList>

                {/* Tab 1: Kitob haqida */}
                <TabsContent value="info" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-xl border border-border bg-card p-6">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h1 className="text-2xl font-bold text-foreground">{book.title}</h1>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Checkbox
                                            id="is_active"
                                            checked={book.is_active}
                                            onCheckedChange={(checked) => handleToggleActive(!!checked)}
                                        />
                                        <Label htmlFor="is_active" className="text-sm cursor-pointer whitespace-nowrap">
                                            Faol (studentga ko'rinsin)
                                        </Label>
                                    </div>
                                </div>
                                <p className="text-muted-foreground mb-4">{book.author || 'Muallif ko\'rsatilmagan'}</p>
                                <p className="text-foreground">{book.description || 'Tavsif yo\'q'}</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Eye className="h-4 w-4"/>
                                        <span className="text-sm">Ko'rishlar</span>
                                    </div>
                                    <p className="font-semibold text-foreground text-lg">{viewers.length}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Download className="h-4 w-4"/>
                                        <span className="text-sm">Ochilgan</span>
                                    </div>
                                    <p className="font-semibold text-foreground text-lg">{book.download_count}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Gift className="h-4 w-4"/>
                                        <span className="text-sm">Sovg'a/sotib olgan</span>
                                    </div>
                                    <p className="font-semibold text-foreground text-lg">{giftedUsers.length}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <BookOpen className="h-4 w-4"/>
                                        <span className="text-sm">Sahifalar</span>
                                    </div>
                                    <p className="font-semibold text-foreground text-lg">{book.pages || '-'}</p>
                                </div>
                            </div>

                            {/* Kitob fayli - kichik, turi bo'yicha */}
                            {book.file_url && (
                                <div className="rounded-xl border border-border bg-card p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary"/>
                                            Kitob fayli
                                        </h3>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={() => setShowFileFullscreen(true)}>
                                            <Maximize2 className="h-4 w-4"/>
                                        </Button>
                                    </div>

                                    <div
                                        onClick={() => setShowFileFullscreen(true)}
                                        className="rounded-lg overflow-hidden border border-border bg-muted/30 cursor-pointer"
                                    >
                                        {fileType === 'image' ? (
                                            <img src={book.file_url} alt={book.title}
                                                 className="w-full max-h-64 object-contain"/>
                                        ) : (
                                            <iframe
                                                src={`${book.file_url}#toolbar=0&navpanes=0`}
                                                title={book.title}
                                                className="w-full h-64 pointer-events-none"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {book.cover && (
                                <img src={book.cover} alt={book.title}
                                     className="w-full rounded-xl border border-border object-cover aspect-[4/4]"/>
                            )}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Janr</span>
                                    <span className="font-medium">{book.genre || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Narxi</span>
                                    <span className="font-medium">
                                        {book.is_free ? 'Bepul' : `${book.price} so'm`}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Holati</span>
                                    <span className="font-medium">{book.is_active ? 'Faol' : 'Nofaol'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Qo'shilgan</span>
                                    <span className="font-medium">{formatDate(book.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 2: Foydalanuvchilar */}
                <TabsContent value="users" className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <Select value={userListType} onValueChange={(v) => setUserListType(v as 'viewers' | 'gifted')}>
                            <SelectTrigger className="w-[220px]"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="viewers">Kimlar ko'rgan</SelectItem>
                                <SelectItem value="gifted">Kimlarga sovg'a/sotilgan</SelectItem>
                            </SelectContent>
                        </Select>

                        {!book.is_free && (
                            <Button onClick={openGrantPanel} className="gradient-primary text-primary-foreground">
                                <UserPlus className="mr-2 h-4 w-4"/>
                                Foydalanuvchiga berish
                            </Button>
                        )}
                    </div>

                    {currentList.length === 0 ? (
                        <div className="text-center py-12 rounded-xl border border-border bg-card">
                            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3"/>
                            <p className="text-muted-foreground">
                                {userListType === 'viewers' ? 'Hali hech kim ko\'rmagan' : 'Hali hech kimga berilmagan'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                                        Foydalanuvchi
                                    </th>
                                    <th className="text-left font-medium text-muted-foreground px-4 py-3">
                                        {userListType === 'viewers' ? 'Ko\'rgan vaqti' : 'Berilgan sababi'}
                                    </th>
                                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Sana</th>
                                    {userListType === 'gifted' && (
                                        <th className="text-right font-medium text-muted-foreground px-4 py-3">Amal</th>
                                    )}
                                </tr>
                                </thead>
                                <tbody>
                                {userListType === 'viewers'
                                    ? viewers.map((v: any) => (
                                        <tr key={v.id} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3 font-medium text-foreground">{v.user_name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">-</td>
                                            <td className="px-4 py-3 text-muted-foreground">{formatDate(v.viewed_at)}</td>
                                        </tr>
                                    ))
                                    : giftedUsers.map((g: any) => (
                                        <tr key={g.id} className="border-b border-border last:border-0">
                                            <td className="px-4 py-3 font-medium text-foreground">{g.user_name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {g.granted_by === 'gift' ? 'Sovg\'a qilingan' : 'Sotib olingan'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{formatDate(g.granted_at)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="outline"
                                                        className="text-destructive hover:bg-destructive hover:text-white"
                                                        onClick={() => setRevokeTarget(g)}>
                                                    <X className="mr-1 h-3.5 w-3.5"/>
                                                    Qaytarib olish
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                }
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Kitob faylini kattalashtirish modali */}
            {showFileFullscreen && book.file_url && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8"
                    onClick={() => setShowFileFullscreen(false)}
                >
                    <button
                        onClick={() => setShowFileFullscreen(false)}
                        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="h-5 w-5"/>
                    </button>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-full max-w-4xl bg-card rounded-xl overflow-hidden"
                    >
                        {fileType === 'image' ? (
                            <div className="w-full h-full flex items-center justify-center overflow-auto bg-muted/30">
                                <img src={book.file_url} alt={book.title} className="max-w-full max-h-full object-contain"/>
                            </div>
                        ) : (
                            <iframe src={`${book.file_url}#toolbar=0&navpanes=0`} title={book.title} className="w-full h-full"/>
                        )}
                    </div>
                </div>
            )}

            {/* Foydalanuvchiga berish paneli */}
            {showGrantPanel && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setShowGrantPanel(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-card rounded-xl border border-border overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h3 className="font-semibold text-lg">Foydalanuvchilarga berish</h3>
                            <button onClick={() => setShowGrantPanel(false)}>
                                <X className="h-5 w-5 text-muted-foreground"/>
                            </button>
                        </div>

                        <div className="p-5 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Ism yoki username bo'yicha qidirish..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            {selectedUserIds.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    {selectedUserIds.length} ta foydalanuvchi tanlandi
                                </p>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {filteredUsersForGrant.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Foydalanuvchi topilmadi</p>
                            ) : (
                                filteredUsersForGrant.map((u: any) => (
                                    <div
                                        key={u.id}
                                        onClick={() => toggleUserSelect(String(u.id))}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                                    >
                                        <Checkbox checked={selectedUserIds.includes(String(u.id))}/>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                            {(u.first_name || u.username || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-5 border-t border-border flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowGrantPanel(false)}>Bekor qilish</Button>
                            <Button onClick={handleGrantSubmit} disabled={grantLoading}
                                    className="gradient-primary text-primary-foreground">
                                {grantLoading ? 'Berilmoqda...' : `Berish (${selectedUserIds.length})`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Kitobni o'chirish tasdiqlash */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Kitobni o'chirish"
                description="Rostdan ham bu kitobni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleDelete}
            />

            {/* Huquqni qaytarib olish tasdiqlash */}
            <ConfirmDialog
                open={!!revokeTarget}
                onOpenChange={(open) => !open && setRevokeTarget(null)}
                title="Huquqni qaytarib olish"
                description={`Rostdan ham ${revokeTarget?.user_name || ''} uchun kitobga kirish huquqini qaytarib olmoqchimisiz?`}
                confirmText="Ha, qaytarib olish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleRevoke}
            />
        </DashboardLayout>
    );
}