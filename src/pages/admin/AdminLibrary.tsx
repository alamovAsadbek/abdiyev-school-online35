import {useState, useEffect, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {Search, BookOpen, Plus, Pencil, Trash2, Eye, EyeOff} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {booksApi} from '@/services/api';
import {cn} from '@/lib/utils';

interface Book {
    id: string;
    title: string;
    author: string;
    genre: string;
    cover: string | null;
    price: number;
    is_free: boolean;
    is_active: boolean;
    pages: number | null;
    download_count: number;
}

export default function AdminLibrary() {
    const navigate = useNavigate();
    const {toast} = useToast();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const loadBooks = () => {
        setLoading(true);
        booksApi.getAll()
            .then(res => setBooks(res?.results || res || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadBooks();
    }, []);

    const filteredBooks = useMemo(() => {
        return books.filter(b => {
            const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && b.is_active) ||
                (statusFilter === 'inactive' && !b.is_active);
            return matchesSearch && matchesStatus;
        });
    }, [books, search, statusFilter]);

    const handleToggleActive = async (book: Book) => {
        try {
            const fd = new FormData();
            fd.append('is_active', String(!book.is_active));
            await booksApi.update(book.id, fd);
            setBooks(prev => prev.map(b => b.id === book.id ? {...b, is_active: !b.is_active} : b));
            toast({title: 'Muvaffaqiyat', description: !book.is_active ? 'Kitob faollashtirildi' : 'Kitob nofaol qilindi'});
        } catch {
            toast({title: 'Xatolik', description: 'Holatni o\'zgartirishda xatolik', variant: 'destructive'});
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await booksApi.delete(deleteId);
            setBooks(prev => prev.filter(b => b.id !== deleteId));
            toast({title: 'O\'chirildi', description: 'Kitob o\'chirildi'});
        } catch {
            toast({title: 'Xatolik', description: 'O\'chirishda xatolik', variant: 'destructive'});
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Kutubxona</h1>
                    <p className="text-muted-foreground">{books.length} ta kitob va qo'llanma</p>
                </div>
                <Button onClick={() => navigate('/admin/library/create')} className="gradient-primary text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4"/> Yangi kitob qo'shish
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Kitob nomi bo'yicha qidirish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Holati"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        <SelectItem value="active">Faol</SelectItem>
                        <SelectItem value="inactive">Nofaol</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"/>
                </div>
            ) : filteredBooks.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-border bg-card">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
                    <p className="text-muted-foreground">Hech narsa topilmadi</p>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left font-medium text-muted-foreground px-4 py-3 w-12">#</th>
                                <th className="text-left font-medium text-muted-foreground px-4 py-3">Kitob</th>
                                <th className="text-left font-medium text-muted-foreground px-4 py-3">Muallif</th>
                                <th className="text-left font-medium text-muted-foreground px-4 py-3">Janr</th>
                                <th className="text-left font-medium text-muted-foreground px-4 py-3">Narxi</th>
                                <th className="text-left font-medium text-muted-foreground px-4 py-3">Yuklangan</th>
                                <th className="text-left font-medium text-muted-foreground px-4 py-3">Holati</th>
                                <th className="text-right font-medium text-muted-foreground px-4 py-3">Amallar</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredBooks.map((book, index) => (
                                <tr
                                    key={book.id}
                                    onClick={() => navigate(`/admin/library/${book.id}`)}
                                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-8 rounded overflow-hidden bg-muted flex-shrink-0">
                                                {book.cover ? (
                                                    <img src={book.cover} alt="" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen className="h-4 w-4 text-muted-foreground"/>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-medium text-foreground">{book.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{book.author || '-'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{book.genre || '-'}</td>
                                    <td className="px-4 py-3">
                                        {book.is_free ? (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600">Bepul</span>
                                        ) : (
                                            <span className="text-foreground font-medium">{book.price} so'm</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{book.download_count}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleActive(book);
                                        }}>
                                            <Badge className={cn(
                                                "cursor-pointer",
                                                book.is_active
                                                    ? "bg-green-500/10 text-green-600 border-green-500/30"
                                                    : "bg-muted text-muted-foreground border-border"
                                            )}>
                                                {book.is_active ? <><Eye className="mr-1 h-3 w-3"/>Faol</> : <><EyeOff className="mr-1 h-3 w-3"/>Nofaol</>}
                                            </Badge>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/library/${book.id}/edit`);
                                            }}>
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteId(book.id);
                                                    }}>
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Kitobni o'chirish"
                description="Rostdan ham bu kitobni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                confirmText="Ha, o'chirish"
                cancelText="Bekor qilish"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </DashboardLayout>
    );
}