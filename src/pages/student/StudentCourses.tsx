import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Lock, X, ShoppingCart } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { CategoryCard } from '@/components/CategoryCard';
import { demoCategories, getUserCourses, Category, formatCurrency } from '@/data/demoData';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function StudentCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterAccess, setFilterAccess] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Category | null>(null);

  // Get user's accessible courses
  const userCourses = user ? getUserCourses(user.id) : [];
  const accessibleCourseIds = userCourses.map(uc => uc.categoryId);

  // Filter categories
  const filteredCategories = demoCategories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(search.toLowerCase()) ||
                         category.description.toLowerCase().includes(search.toLowerCase());
    
    const hasAccess = accessibleCourseIds.includes(category.id);
    
    if (filterAccess === 'accessible') return matchesSearch && hasAccess;
    if (filterAccess === 'locked') return matchesSearch && !hasAccess;
    
    return matchesSearch;
  });

  const handleCourseClick = (categoryId: string) => {
    const hasAccess = accessibleCourseIds.includes(categoryId);
    if (hasAccess) {
      navigate(`/student/category/${categoryId}`);
    } else {
      const course = demoCategories.find(c => c.id === categoryId);
      setSelectedCourse(course || null);
    }
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kurs qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterAccess} onValueChange={setFilterAccess}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Kirish bo'yicha filter" />
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
            <div key={category.id} className="animate-fade-in relative" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
              <CategoryCard
                category={category}
                onClick={() => handleCourseClick(category.id)}
              />
              {!hasAccess && (
                <div 
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center cursor-pointer"
                  onClick={() => handleCourseClick(category.id)}
                >
                  <div className="text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-2">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Kurs yopiq
                    </p>
                  </div>
                </div>
              )}
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
              <Button className="gradient-primary text-primary-foreground">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Sotib olish
              </Button>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
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
