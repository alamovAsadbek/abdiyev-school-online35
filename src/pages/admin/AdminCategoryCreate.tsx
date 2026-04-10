import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Layers, Lock, Unlock, GripVertical } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { categoriesApi, modulesApi } from '@/services/api';

interface Module {
  id?: string;
  name: string;
  description: string;
  order: number;
  price?: number;
  is_free?: boolean;
  isNew?: boolean;
}

const iconOptions = ['⚗️', '🧪', '🔬', '📊', '🧬', '⚛️', '🔥', '💧', '📚', '🎯'];

export default function AdminCategoryCreate() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const isEditing = !!categoryId;
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '⚗️',
    price: '',
    is_free: false,
    is_modular: false,
    requires_sequential: true,
  });
  
  const [modules, setModules] = useState<Module[]>([]);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [newModulePrice, setNewModulePrice] = useState('');

  useEffect(() => {
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      const category = await categoriesApi.getById(categoryId!);
      const price = category.price?.toString() || '';
      const isFree = !price || parseFloat(price) === 0;
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon,
        price: isFree ? '' : price,
        is_free: isFree,
        is_modular: category.is_modular || false,
        requires_sequential: category.requires_sequential !== false,
      });
      
      if (category.is_modular) {
        const modulesData = await modulesApi.getByCategory(categoryId!);
        const modulesList = modulesData?.results || modulesData || [];
        setModules(modulesList.map((m: any) => ({
          id: m.id,
          name: m.name,
          description: m.description || '',
          order: m.order,
          price: m.price,
          is_free: !m.price || parseFloat(m.price) === 0,
        })));
      }
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Kurs ma\'lumotlarini yuklashda xatolik',
        variant: 'destructive',
      });
    }
  };

  // When course is set to free, auto-set all modules to free
  const handleFreeToggle = (isFree: boolean) => {
    setFormData(prev => ({ ...prev, is_free: isFree, price: isFree ? '0' : prev.price === '0' ? '' : prev.price }));
    if (isFree && formData.is_modular) {
      setModules(prev => prev.map(m => ({ ...m, price: 0, is_free: true })));
    }
  };

  const handleAddModule = () => {
    if (!newModuleName.trim()) {
      toast({ title: 'Xatolik', description: 'Modul nomini kiriting', variant: 'destructive' });
      return;
    }

    const modulePrice = formData.is_free ? 0 : (newModulePrice ? parseFloat(newModulePrice) : undefined);

    const newModule: Module = {
      name: newModuleName,
      description: newModuleDescription,
      order: modules.length + 1,
      price: modulePrice,
      is_free: formData.is_free || !modulePrice,
      isNew: true,
    };

    setModules([...modules, newModule]);
    setNewModuleName('');
    setNewModuleDescription('');
    setNewModulePrice('');
  };

  const handleRemoveModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    updatedModules.forEach((m, i) => { m.order = i + 1; });
    setModules(updatedModules);
  };

  const handleModuleFreeToggle = (index: number, isFree: boolean) => {
    setModules(prev => prev.map((m, i) => 
      i === index ? { ...m, is_free: isFree, price: isFree ? 0 : m.price } : m
    ));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Xatolik', description: 'Kurs nomini kiriting', variant: 'destructive' });
      return;
    }

    if (formData.is_modular && modules.length === 0) {
      toast({ title: 'Xatolik', description: 'Modulli kurs uchun kamida bitta modul qo\'shing', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        price: formData.is_free ? 0 : (parseInt(formData.price) || 0),
        is_modular: formData.is_modular,
        requires_sequential: formData.requires_sequential,
      };

      let savedCategoryId = categoryId;

      if (isEditing) {
        await categoriesApi.update(categoryId!, payload);
        toast({ title: 'Muvaffaqiyat', description: 'Kurs yangilandi' });
      } else {
        const response = await categoriesApi.create(payload);
        savedCategoryId = response.id;
        toast({ title: 'Muvaffaqiyat', description: 'Yangi kurs qo\'shildi' });
      }

      if (formData.is_modular && savedCategoryId) {
        for (const module of modules) {
          const modulePayload = {
            category: savedCategoryId,
            name: module.name,
            description: module.description,
            order: module.order,
            price: module.is_free ? 0 : (module.price || null),
          };
          if (module.isNew) {
            await modulesApi.create(modulePayload);
          } else if (module.id) {
            await modulesApi.update(module.id, modulePayload);
          }
        }
      }

      navigate('/admin/categories');
    } catch (error) {
      toast({ title: 'Xatolik', description: 'Saqlashda xatolik yuz berdi', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/categories')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="animate-fade-in">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {isEditing ? 'Kursni tahrirlash' : 'Yangi kurs yaratish'}
            </h1>
            <p className="text-muted-foreground">Kurs ma'lumotlarini kiriting</p>
          </div>
        </div>

        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Basic Info */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Asosiy ma'lumotlar</h2>

            <div className="space-y-2">
              <Label>Ikonka</Label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      formData.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Kurs nomi <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Masalan: Umumiy Kimyo"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                placeholder="Kurs haqida qisqacha ma'lumot"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Price section with free toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label>Bepul kurs</Label>
                  <p className="text-xs text-muted-foreground">
                    Bepul kursga hamma kirishi mumkin
                  </p>
                </div>
                <Switch
                  checked={formData.is_free}
                  onCheckedChange={handleFreeToggle}
                />
              </div>
              
              {!formData.is_free && (
                <div className="space-y-2">
                  <Label htmlFor="price">Narxi (so'm)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="150000"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Sozlamalar</h2>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Modulli kurs
                </Label>
                <p className="text-xs text-muted-foreground">
                  Kursni modullarga ajratish (har bir modulni alohida sotish mumkin)
                </p>
              </div>
              <Switch
                checked={formData.is_modular}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_modular: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {formData.requires_sequential ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  Ketma-ket ko'rish
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.requires_sequential
                    ? "Video va vazifalarni ketma-ket bajarish shart"
                    : "O'quvchi istalgan darsni ko'ra oladi"}
                </p>
              </div>
              <Switch
                checked={formData.requires_sequential}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_sequential: checked }))}
              />
            </div>
          </div>

          {/* Modules Section */}
          {formData.is_modular && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Modullar
              </h2>
              <p className="text-sm text-muted-foreground">
                {formData.is_free 
                  ? "Kurs bepul bo'lgani uchun barcha modullar ham bepul."
                  : "Kurs modullarini qo'shing. Har bir modul alohida sotilishi mumkin."}
              </p>

              {modules.length > 0 && (
                <div className="space-y-2">
                  {modules.map((module, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{module.name}</p>
                        {module.description && (
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        )}
                        <p className="text-xs mt-1">
                          {module.is_free || formData.is_free ? (
                            <span className="text-green-600 font-medium">Bepul</span>
                          ) : module.price ? (
                            <span className="text-primary">{new Intl.NumberFormat('uz-UZ').format(module.price)} so'm</span>
                          ) : (
                            <span className="text-muted-foreground">Kurs narxida</span>
                          )}
                        </p>
                      </div>
                      {!formData.is_free && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Bepul</Label>
                          <Switch
                            checked={module.is_free || false}
                            onCheckedChange={(checked) => handleModuleFreeToggle(index, checked)}
                          />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveModule(index)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Module */}
              <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
                <p className="text-sm font-medium">Yangi modul qo'shish</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Modul nomi *"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                  />
                  {!formData.is_free && (
                    <Input
                      type="number"
                      placeholder="Narxi (ixtiyoriy)"
                      value={newModulePrice}
                      onChange={(e) => setNewModulePrice(e.target.value)}
                    />
                  )}
                </div>
                <Textarea
                  placeholder="Modul tavsifi (ixtiyoriy)"
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  rows={2}
                />
                <Button type="button" variant="outline" onClick={handleAddModule} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Modul qo'shish
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/categories')}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSave}
              className="gradient-primary text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? 'Saqlanmoqda...' : isEditing ? 'Yangilash' : 'Saqlash'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
