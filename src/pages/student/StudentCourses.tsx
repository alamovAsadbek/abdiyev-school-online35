import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Lock } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { CategoryCard } from '@/components/CategoryCard';
import { demoCategories, getUserCourses } from '@/data/demoData';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StudentCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterAccess, setFilterAccess] = useState<string>('all');

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
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center cursor-not-allowed">
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
    </DashboardLayout>
  );
}
