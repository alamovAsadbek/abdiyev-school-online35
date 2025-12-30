import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Search, Lock, ShoppingCart} from 'lucide-react';
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
                setCategories(categoriesData?.results);
            }

            if (userCoursesData) {
                setAccessibleCourseIds(userCoursesData.map((uc: any) => uc.category_id || uc.categoryId));
            } else if (user) {
                // Fallback to demo data
                const userCourses = getUserCourses(user.id);
                setAccessibleCourseIds(userCourses.map(uc => uc.categoryId));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to demo data
            if (user) {
                const userCourses = getUserCourses(user.id);
                setAccessibleCourseIds(userCourses.map(uc => uc.categoryId));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Filter categories
    const filteredCategories = categories?.filter(category => {
        const matchesSearch =
            category.name.toLowerCase().includes(search.toLowerCase()) ||
            category.description.toLowerCase().includes(search.toLowerCase());

        const hasAccess = accessibleCourseIds.includes(category.id);

        if (filterAccess === 'accessible') return matchesSearch && hasAccess;
        if (filterAccess === 'locked') return matchesSearch && !hasAccess;

        return matchesSearch;
    }) ?? [];


    const handleCourseClick = (categoryId: string) => {
        const hasAccess = accessibleCourseIds.includes(categoryId);
        if (hasAccess) {
            navigate(`/student/category/${categoryId}`);
        } else {
            const course = categories.find(c => c.id === categoryId);
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
                    const hasAccess = accessibleCourseIds.includes(category.id);

                    return (
                        <div
                            key={category.id}
                            className="animate-fade-in relative"
                            style={{animationDelay: `${0.1 + index * 0.05}s`}}
                        >
                            {/* Course Card */}
                            <div
                                onClick={() => handleCourseClick(category.id)}
                                className={`rounded-xl border bg-card p-5 cursor-pointer transition-all hover:shadow-lg ${hasAccess ? 'border-border hover:border-primary/50' : 'border-border/50'
                                }`}
                            >
                                {/* Icon and Lock Badge */}
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                                        {category.icon}
                                    </div>
                                    {!hasAccess && (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            <Lock className="h-4 w-4 text-muted-foreground"/>
                                        </div>
                                    )}
                                </div>

                                {/* Course Info */}
                                <h3 className="font-semibold text-card-foreground mb-2 line-clamp-1">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {category.description}
                                </p>

                                {/* Price and Status */}
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className={`text-lg font-bold ${hasAccess ? 'text-success' : 'text-primary'}`}>
                    {hasAccess ? 'Ochiq' : formatCurrency(category.price)}
                  </span>
                                    <span className="text-xs text-muted-foreground">
                    {category.videoCount} ta video
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
