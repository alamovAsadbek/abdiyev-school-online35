import {useState, useRef, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Upload, Image as ImageIcon, AlertTriangle, X} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {useToast} from '@/hooks/use-toast';
import {booksApi} from '@/services/api';
import {Checkbox} from "@/components/ui/checkbox";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

export default function AdminBookCreate() {
    const navigate = useNavigate();
    const {bookId} = useParams();
    const isEdit = !!bookId;
    const {toast} = useToast();

    const coverInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        description: '',
        genre: '',
        price: '',
        isFree: true,
        pages: '',
        isActive: true,
    });

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [bookFile, setBookFile] = useState<File | null>(null);
    const [bookFileError, setBookFileError] = useState('');
    const [existingFileName, setExistingFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEdit);

    useEffect(() => {
        if (!isEdit) return;
        booksApi.getById(bookId!)
            .then((data: any) => {
                setFormData({
                    title: data.title || '',
                    author: data.author || '',
                    description: data.description || '',
                    genre: data.genre || '',
                    price: data.price && Number(data.price) > 0 ? String(data.price) : '',
                    isFree: !data.price || Number(data.price) === 0,
                    pages: data.pages ? String(data.pages) : '',
                    isActive: !!data.is_active,
                });
                if (data.cover) setCoverPreview(data.cover);
                if (data.file_url) setExistingFileName('Hozirgi fayl mavjud');
            })
            .catch(() => {
                toast({
                    title: 'Xatolik',
                    description: 'Kitob ma\'lumotlarini yuklashda xatolik',
                    variant: 'destructive'
                });
            })
            .finally(() => setIsFetching(false));
    }, [bookId, isEdit, toast]);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setBookFileError('Faqat PDF yoki rasm (JPG, PNG, WEBP) formatlari qabul qilinadi');
            e.target.value = '';
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setBookFileError('Fayl hajmi 20MB dan oshmasligi kerak');
            e.target.value = '';
            return;
        }

        setBookFileError('');
        setBookFile(file);
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast({title: 'Xatolik', description: 'Sarlavhani kiriting', variant: 'destructive'});
            return;
        }
        if (!isEdit && !bookFile) {
            toast({title: 'Xatolik', description: 'Kitob faylini yuklang', variant: 'destructive'});
            return;
        }

        if (!formData.isFree && (!formData.price || Number(formData.price) <= 0)) {
            toast({title: 'Xatolik', description: 'Pullik kitob uchun narxni kiriting', variant: 'destructive'});
            return;
        }

        setIsLoading(true);
        try {
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('author', formData.author);
            fd.append('description', formData.description);
            fd.append('genre', formData.genre);
            fd.append('price', formData.isFree ? '0' : (formData.price || '0'));
            if (formData.pages) fd.append('pages', formData.pages);
            fd.append('is_active', String(formData.isActive));

            if (coverFile) fd.append('cover_file', coverFile);
            if (bookFile) fd.append('file', bookFile);

            if (isEdit) {
                await booksApi.update(bookId!, fd);
                toast({title: 'Muvaffaqiyat', description: 'Kitob yangilandi'});
            } else {
                await booksApi.create(fd);
                toast({title: 'Muvaffaqiyat', description: 'Kitob qo\'shildi'});
            }
            navigate('/admin/library');
        } catch (error: any) {
            toast({
                title: 'Xatolik',
                description: error?.response?.data?.error || 'Saqlashda xatolik',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
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
            <div className="w-full mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate('/admin/library')}>
                        <ArrowLeft className="h-4 w-4"/>
                    </Button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                            {isEdit ? 'Kitobni tahrirlash' : 'Yangi kitob qo\'shish'}
                        </h1>
                        <p className="text-muted-foreground">Kutubxonaga kitob yoki qo'llanma qo'shish</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Asosiy ma'lumotlar */}
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Asosiy ma'lumotlar</h2>

                        <div className="space-y-2">
                            <Label htmlFor="title">Sarlavha <span className="text-destructive">*</span></Label>
                            <Input
                                id="title"
                                placeholder="Kitob nomi"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="author">Muallif</Label>
                                <Input
                                    id="author"
                                    placeholder="Muallif ismi"
                                    value={formData.author}
                                    onChange={(e) => setFormData(prev => ({...prev, author: e.target.value}))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="genre">Janr</Label>
                                <Input
                                    id="genre"
                                    placeholder="Masalan: Kimyo"
                                    value={formData.genre}
                                    onChange={(e) => setFormData(prev => ({...prev, genre: e.target.value}))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Tavsif</Label>
                            <Textarea
                                id="description"
                                placeholder="Kitob haqida qisqacha"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">

                            <div className="space-y-2">
                                <Label htmlFor="pages">Sahifalar soni</Label>
                                <Input
                                    id="pages"
                                    type="number"
                                    min="0"
                                    placeholder="masalan: 240"
                                    value={formData.pages}
                                    onChange={(e) => setFormData(prev => ({...prev, pages: e.target.value}))}
                                />
                            </div>
                        </div>
                        <div className="space-y-3 mt3">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="isFree"
                                    checked={formData.isFree}
                                    onCheckedChange={(checked) => setFormData(prev => ({
                                        ...prev,
                                        isFree: !!checked,
                                        price: checked ? '' : prev.price,
                                    }))}
                                />
                                <Label htmlFor="isFree" className="cursor-pointer">Bepul kitob</Label>
                            </div>

                            {!formData.isFree && (
                                <div className="space-y-2">
                                    <Label htmlFor="price">Narxi (so'm) <span
                                        className="text-destructive">*</span></Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="1"
                                        placeholder="masalan: 50000"
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div>
                                <Label>Faol (studentlarga ko'rinsin)</Label>
                                <p className="text-xs text-muted-foreground">O'chirilsa, faqat admin ko'radi, studentga
                                    ko'rinmaydi</p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData(prev => ({...prev, isActive: checked}))}
                            />
                        </div>
                    </div>

                    {/* Muqova */}
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Muqova rasmi</h2>
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                               onChange={handleCoverChange}/>
                        <Button type="button" variant="outline" className="w-full"
                                onClick={() => coverInputRef.current?.click()}>
                            <ImageIcon className="mr-2 h-4 w-4"/>
                            {coverFile ? coverFile.name : 'Muqova rasmini tanlang'}
                        </Button>
                        {coverPreview && (
                            <img src={coverPreview} alt="Preview"
                                 className="w-32 h-44 object-cover rounded-lg border border-border"/>
                        )}
                    </div>

                    {/* Kitob fayli */}
                    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Kitob fayli</h2>
                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0"/>
                                <span>Faqat PDF yoki rasm (JPG, PNG, WEBP), maksimal hajmi 20MB</span>
                            </p>
                        </div>

                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleBookFileChange}/>
                        <Button
                            type="button"
                            variant="outline"
                            className={`w-full ${bookFileError ? 'border-destructive' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="mr-2 h-4 w-4"/>
                            {bookFile ? bookFile.name : (existingFileName || 'Kitob faylini tanlang')}
                        </Button>
                        {bookFileError && <p className="text-sm text-destructive">{bookFileError}</p>}

                        {bookFile && (
                            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-medium text-sm text-foreground">Fayl ma'lumotlari</h3>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setBookFile(null)}>
                                        <X className="mr-1 h-4 w-4"/> O'chirish
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Fayl nomi: </span>
                                        <span className="text-foreground">{bookFile.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Hajmi: </span>
                                        <span
                                            className="text-foreground">{(bookFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => navigate('/admin/library')}>Bekor qilish</Button>
                        <Button onClick={handleSubmit} disabled={isLoading}
                                className="gradient-primary text-primary-foreground">
                            {isLoading ? 'Saqlanmoqda...' : isEdit ? 'Saqlash' : 'Qo\'shish'}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}