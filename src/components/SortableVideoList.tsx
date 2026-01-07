import {useState} from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical, Clock, Eye} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Video {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    order: number;
    view_count?: number;
}

interface SortableVideoListProps {
    videos: Video[];
    onReorder: (videos: Video[]) => Promise<void>;
    onVideoClick?: (video: Video) => void;
}

interface SortableItemProps {
    video: Video;
    onClick?: () => void;
}

function SortableItem({video, onClick}: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: video.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all ${isDragging ? 'shadow-lg' : ''}`}
        >
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                <GripVertical className="h-5 w-5 text-muted-foreground"/>
            </button>
            
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                {video.order}
            </span>

            <img
                src={video.thumbnail || '/placeholder.svg'}
                alt={video.title}
                className="w-20 h-12 object-cover rounded cursor-pointer"
                onClick={onClick}
            />

            <div className="flex-1 cursor-pointer" onClick={onClick}>
                <p className="font-medium text-card-foreground">{video.title}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3"/>{video.duration}
                    </span>
                    {video.view_count !== undefined && (
                        <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3"/>{video.view_count}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function SortableVideoList({videos, onReorder, onVideoClick}: SortableVideoListProps) {
    const [items, setItems] = useState(videos);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingChange, setPendingChange] = useState<{from: number; to: number; newItems: Video[]} | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(v => v.id === active.id);
        const newIndex = items.findIndex(v => v.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            order: idx + 1,
        }));

        setPendingChange({
            from: items[oldIndex].order,
            to: items[newIndex].order,
            newItems,
        });
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        if (!pendingChange) return;
        setItems(pendingChange.newItems);
        await onReorder(pendingChange.newItems);
        setShowConfirm(false);
        setPendingChange(null);
    };

    const handleCancel = () => {
        setShowConfirm(false);
        setPendingChange(null);
    };

    return (
        <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(v => v.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {items.map((video) => (
                            <SortableItem
                                key={video.id}
                                video={video}
                                onClick={() => onVideoClick?.(video)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tartibni o'zgartirish</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingChange && (
                                <>
                                    <span className="font-semibold text-foreground">{pendingChange.from}-dars</span>ni{' '}
                                    <span className="font-semibold text-foreground">{pendingChange.to}-dars</span> joyiga ko'chirmoqchimisiz?
                                    <br /><br />
                                    Bu o'zgarish barcha o'quvchilar uchun qo'llaniladi.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} className="gradient-primary text-primary-foreground">
                            Tasdiqlash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
