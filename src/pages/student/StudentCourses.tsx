import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Search, Lock, ShoppingCart, Gift} from 'lucide-react';
import {DashboardLayout} from '@/layouts/DashboardLayout';
import {demoCategories, getUserCourses, Category, formatCurrency} from '@/data/demoData';
import {useAuth} from '@/contexts/AuthContext';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {categoriesApi, userCoursesApi} from '@/services/api';
import {useToast} from '@/hooks/use-toast';

export default function StudentCourses() {
    const navigate = useNavigate();
    const {user} = useAuth();
    const {toast} = useToast();
    const [search, setSearch] = useState('');
    const [filterAccess, setFilterAccess] = useState<string>('all');
    const [selectedCourse, setSelectedCourse] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>();
    const [accessibleCourseIds, setAccessibleCourseIds] = useState<string[]>([]);
    const [courseGrantedBy, setCourseGrantedBy] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            // Try to load from API first
            const [categoriesData, userCoursesData] = await Promise.all([
                categoriesApi.getAll().catch(() => null),
                userCoursesApi.getMyCourses().catch(() => null)
            ]);

            if (categoriesData) {
                const list = (categoriesData as any)?.results || categoriesData;
                setCategories(list);
            }

            if (userCoursesData) {
                const courses = (userCoursesData as any)?.results || userCoursesData || [];
                const map: Record<string, string> = {};

                for (const uc of courses) {
                    const categoryId = (uc as any)?.category ?? (uc as any)?.category_id ?? (uc as any)?.categoryId;
                    if (categoryId !== undefined && categoryId !== null) {
                        map[String(categoryId)] = (uc as any)?.granted_by ?? (uc as any)?.grantedBy ?? 'payment';
                    }
                }

                setCourseGrantedBy(map);
                setAccessibleCourseIds(Object.keys(map));
            } else if (user) {
                // Fallback to demo data
                const userCourses = getUserCourses(user.id);
                const map: Record<string, string> = {};
                userCourses.forEach((uc) => {
                    map[String(uc.categoryId)] = uc.grantedBy;
                });
                setCourseGrantedBy(map);
                setAccessibleCourseIds(Object.keys(map));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to demo data
            if (user) {
                const userCourses = getUserCourses(user.id);
                const map: Record<string, string> = {};
                userCourses.forEach((uc) => {
                    map[String(uc.categoryId)] = uc.grantedBy;
                });
                setCourseGrantedBy(map);
                setAccessibleCourseIds(Object.keys(map));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Filter categories
    const filteredCategories = categories?.filter(category => {
        const matchesSearch =
            (category.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (category.description ?? '').toLowerCase().includes(search.toLowerCase());

        const hasAccess = accessibleCourseIds.includes(String((category as any).id));

        if (filterAccess === 'accessible') return matchesSearch && hasAccess;
        if (filterAccess === 'locked') return matchesSearch && !hasAccess;

        return matchesSearch;
    }) ?? [];


    const handleCourseClick = (categoryId: string) => {
        const id = String(categoryId);
        const hasAccess = accessibleCourseIds.includes(id);
        if (hasAccess) {
            navigate(`/student/category/${id}`);
        } else {
            const course = categories?.find((c) => String((c as any).id) === id);
            setSelectedCourse(course || null);
        }
    };

    const handlePurchase = () => {
        if (!selectedCourse) return;
        
        // Add to cart
        const savedCart = localStorage.getItem('course_cart');
        const cart = savedCart ? JSON.parse(savedCart) : [];
        
        if (!cart.find((c: any) => c.id === selectedCourse.id)) {
            cart.push({
                id: selectedCourse.id,
                name: selectedCourse.name,
                icon: selectedCourse.icon,
                price: selectedCourse.price,
                description: selectedCourse.description,
            });
            localStorage.setItem('course_cart', JSON.stringify(cart));
        }
        
        setSelectedCourse(null);
        navigate('/student/checkout');
    };

    return (
        <DashboardLayout>
            <div className="mb-8 animate-fade-in">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    Kurslar
                </h1>
                <p className="text-muted-foreground">
                    O'zingizga kerakli kursni tanlang
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Kurs qidirish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterAccess} onValueChange={setFilterAccess}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Kirish bo'yicha filter"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Barcha kurslar</SelectItem>
                        <SelectItem value="accessible">Ochiq kurslar</SelectItem>
                        <SelectItem value="locked">Yopiq kurslar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredCategories.map((category, index) => {
                    const categoryId = String((category as any).id);
                    const hasAccess = accessibleCourseIds.includes(categoryId);
                    const grantedBy = courseGrantedBy[categoryId];
                    const isGifted = hasAccess && grantedBy === 'gift';

                    const videoCount = (category as any).videoCount ?? (category as any).video_count ?? 0;
                    const price = Number((category as any).price ?? 0);

                    return (
                        <div
                            key={categoryId}
                            className="animate-fade-in relative"
                            style={{animationDelay: `${0.1 + index * 0.05}s`}}
                        >
                            {/* Course Card */}
                            <div
                                onClick={() => handleCourseClick(categoryId)}
                                className={`rounded-xl border bg-card p-5 cursor-pointer transition-all hover:shadow-lg ${hasAccess ? 'border-border hover:border-primary/50' : 'border-border/50'
                                }`}
                            >
                                {/* Icon and Lock/Gift Badge */}
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                                        {(category as any).icon}
                                    </div>

                                    {!hasAccess ? (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            <Lock className="h-4 w-4 text-muted-foreground"/>
                                        </div>
                                    ) : isGifted ? (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                                            <Gift className="h-4 w-4"/>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Course Info */}
                                <h3 className="font-semibold text-card-foreground mb-2 line-clamp-1">
                                    {(category as any).name}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {(category as any).description || ''}
                                </p>

                                {/* Price and Status */}
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className={`text-lg font-bold ${hasAccess ? 'text-success' : 'text-primary'}`}>
                    {hasAccess ? 'Ochiq' : formatCurrency(price)}
                  </span>
                                    <span className="text-xs text-muted-foreground">
                    {videoCount} ta video
                  </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCategories.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                    <p className="text-muted-foreground">
                        {search || filterAccess !== 'all' ? "Hech qanday kurs topilmadi" : "Hali kurslar yo'q"}
                    </p>
                </div>
            )}

            {/* Course Details Dialog */}
            <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl">
                            <span className="text-3xl">{selectedCourse?.icon}</span>
                            {selectedCourse?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">TAVSIF</h3>
                            <p className="text-foreground leading-relaxed">{selectedCourse?.description}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Kurs narxi</p>
                                <p className="text-3xl font-bold text-primary">{formatCurrency(selectedCourse?.price || 0)}</p>
                            </div>
                            <Button onClick={handlePurchase} className="gradient-primary text-primary-foreground">
                                <ShoppingCart className="mr-2 h-4 w-4"/>
                                Sotib olish
                            </Button>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-4 border border-border">
                            <p className="text-sm text-muted-foreground flex items-start gap-2">
                                <Lock className="h-4 w-4 mt-0.5 flex-shrink-0"/>
                                <span>
                  Bu kursga kirish uchun sotib olish kerak. Sotib olganingizdan so'ng barcha video darslar va materiallar ochiladi.
                </span>
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
