import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { CategoryCard } from '@/components/CategoryCard';
import { demoCategories } from '@/data/demoData';

export default function StudentCategories() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Kategoriyalar
        </h1>
        <p className="text-muted-foreground">
          O'zingizga kerakli bo'limni tanlang
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {demoCategories.map((category, index) => (
          <div key={category.id} className="animate-fade-in" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
            <CategoryCard
              category={category}
              onClick={() => navigate(`/student/category/${category.id}`)}
            />
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
