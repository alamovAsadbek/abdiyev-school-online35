import {useState, useEffect, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Search, BookOpen, Grid3x3, List, Lock, Eye,
    User as UserIcon, X
} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {booksApi} from '@/services/api';
import {cn} from '@/lib/utils';

interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    genre: string;
    cover: string | null;
    file_url: string | null;
    price: number;
    is_free: boolean;
    is_locked: boolean;
    pages: number | null;
    download_count: number;
}

type ViewMode = 'shelf' | 'grid' | 'table';

const getFileType = (url?: string | null): 'image' | 'pdf' | 'other' | null => {
    if (!url) return null;
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
};

export default function StudentLibrary() {
    const navigate = useNavigate();
    const {toast} = useToast();

    const [books, setBooks] = useState<Book[]>([]);
    const [genres, setGenres] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [genreFilter, setGenreFilter] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('shelf');
    const [previewBook, setPreviewBook] = useState<Book | null>(null);

    useEffect(() => {
        Promise.all([booksApi.getAll(), booksApi.getGenres()])
            .then(([booksRes, genresRes]) => {
                setBooks(booksRes?.results || booksRes || []);
                setGenres(genresRes || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredBooks = useMemo(() => {
        return books.filter(b => {
            const matchesSearch = !search ||
                b.title.toLowerCase().includes(search.toLowerCase()) ||
                (b.author || '').toLowerCase().includes(search.toLowerCase());
            const matchesGenre = genreFilter === 'all' || b.genre === genreFilter;
            const matchesPrice = priceFilter === 'all' ||
                (priceFilter === 'free' && b.is_free) ||
                (priceFilter === 'paid' && !b.is_free);
            return matchesSearch && matchesGenre && matchesPrice;
        });
    }, [books, search, genreFilter, priceFilter]);

    const handleBookClick = (book: Book) => {
        if (book.is_locked) {
            toast({
                title: "Bu kitob pullik",
                description: `Narxi: ${book.price} so'm. Ko'rish uchun tizimga kiring va sotib oling.`,
            });
            navigate('/login');
            return;
        }
        if (book.file_url) {
            setPreviewBook(book);
            booksApi.recordView(book.id).catch(() => {});
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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Kutubxona</h1>
                    <p className="text-muted-foreground">{filteredBooks.length} ta kitob va qo'llanma</p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/30">
                    <button
                        onClick={() => setViewMode('shelf')}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            viewMode === 'shelf' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    >
                        <BookOpen className="h-4 w-4"/> Kutubxona
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    >
                        <Grid3x3 className="h-4 w-4"/> Kartochka
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                            viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    >
                        <List className="h-4 w-4"/> Jadval
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Kitob nomi yoki muallif bo'yicha qidirish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Janr"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barcha janrlar</SelectItem>
                        {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Narxi"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        <SelectItem value="free">Bepul</SelectItem>
                        <SelectItem value="paid">Pullik</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filteredBooks.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-border bg-card">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
                    <p className="text-muted-foreground">Hech narsa topilmadi</p>
                </div>
            ) : viewMode === 'shelf' ? (
                <ShelfView books={filteredBooks} onBookClick={handleBookClick}/>
            ) : viewMode === 'grid' ? (
                <GridView books={filteredBooks} onBookClick={handleBookClick}/>
            ) : (
                <TableView books={filteredBooks} onBookClick={handleBookClick}/>
            )}

            {previewBook && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8"
                    onClick={() => setPreviewBook(null)}
                >
                    <button
                        onClick={() => setPreviewBook(null)}
                        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="h-5 w-5"/>
                    </button>

                    <div className="absolute top-4 left-4 text-white/80 text-sm flex items-center gap-2">
                        <Lock className="h-4 w-4"/>
                        Himoyalangan, yuklab olish taqiqlangan
                    </div>

                    <div
                        onClick={(e) => e.stopPropagation()}
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-full h-full max-w-4xl bg-card rounded-xl overflow-hidden"
                    >
                        {getFileType(previewBook.file_url) === 'image' ? (
                            <div className="w-full h-full flex items-center justify-center overflow-auto bg-muted/30">
                                <img
                                    src={previewBook.file_url || ''}
                                    alt={previewBook.title}
                                    draggable={false}
                                    className="max-w-full max-h-full object-contain select-none"
                                />
                            </div>
                        ) : (
                            <iframe
                                src={`${previewBook.file_url}#toolbar=0&navpanes=0`}
                                title={previewBook.title}
                                className="w-full h-full"
                            />
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function ShelfView({books, onBookClick}: {books: Book[]; onBookClick: (b: Book) => void}) {
    const grouped = books.reduce((acc: Record<string, Book[]>, b) => {
        const key = b.genre || 'Boshqa';
        acc[key] = acc[key] || [];
        acc[key].push(b);
        return acc;
    }, {});

    return (
        <div className="space-y-10">
            {Object.entries(grouped).map(([genre, items]) => (
                <div key={genre}>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary"/> {genre}
                    </h2>
                    <div className="relative">
                        <div className="flex gap-5 overflow-x-auto pb-6 -mx-1 px-1">
                            {items.map(book => (
                                <div
                                    key={book.id}
                                    onClick={() => onBookClick(book)}
                                    className="flex-shrink-0 w-36 cursor-pointer group"
                                >
                                    <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-md border border-border/50 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200 bg-muted">
                                        {book.cover ? (
                                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen className="h-8 w-8 text-muted-foreground"/>
                                            </div>
                                        )}
                                        {book.is_locked && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Lock className="h-6 w-6 text-white"/>
                                            </div>
                                        )}
                                        {book.is_free && !book.is_locked && (
                                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500 text-white">
                                                Bepul
                                            </span>
                                        )}
                                        {!book.is_free && (
                                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground">
                                                {book.price} so'm
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-foreground truncate">{book.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                                </div>
                            ))}
                        </div>
                        <div className="h-2 bg-gradient-to-b from-border to-transparent rounded-full mx-2 -mt-2"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function GridView({books, onBookClick}: {books: Book[]; onBookClick: (b: Book) => void}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {books.map(book => (
                <div
                    key={book.id}
                    onClick={() => onBookClick(book)}
                    className="rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
                >
                    <div className="relative aspect-[4/4] bg-muted">
                        {book.cover ? (
                            <img src={book.cover} alt={book.title}
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-10 w-10 text-muted-foreground"/>
                            </div>
                        )}
                        {book.is_locked ? (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Lock className="h-6 w-6 text-white"/>
                            </div>
                        ) : null}
                        <div className="absolute top-2 right-2">
                            {book.is_free ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">Bepul</span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">{book.price} so'm</span>
                            )}
                        </div>
                    </div>
                    <div className="p-3">
                        <p className="font-medium text-sm text-foreground truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <UserIcon className="h-3 w-3"/> {book.author || 'Noma\'lum'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function TableView({books, onBookClick}: {books: Book[]; onBookClick: (b: Book) => void}) {
    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">#</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Kitob</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Muallif</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Janr</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Narxi</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Sahifa</th>
                        <th className="text-right font-medium text-muted-foreground px-4 py-3">Amal</th>
                    </tr>
                    </thead>
                    <tbody>
                    {books.map((book, index) => (
                        <tr key={book.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
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
                            <td className="px-4 py-3 text-muted-foreground">{book.pages || '-'}</td>
                            <td className="px-4 py-3 text-right">
                                <Button size="sm" variant={book.is_locked ? 'outline' : 'default'} onClick={() => onBookClick(book)}>
                                    {book.is_locked ? <><Lock className="mr-1.5 h-3.5 w-3.5"/>Pullik</> : <><Eye className="mr-1.5 h-3.5 w-3.5"/>Ko'rish</>}
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}