import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  title: string;
  done: boolean;
  onToggle: () => void;
}

export function TodoItem({ title, done, onToggle }: TodoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox checked={done} onCheckedChange={onToggle} />
      <span
        className={cn("text-sm", done && "line-through text-muted-foreground")}
      >
        {title}
      </span>
    </div>
  );
}
