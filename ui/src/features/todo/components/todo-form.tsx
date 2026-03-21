import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const todoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

type TodoFormValues = z.infer<typeof todoFormSchema>;

interface TodoFormProps {
  onSubmit: (title: string) => void;
}

export function TodoForm({ onSubmit }: TodoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: { title: "" },
  });

  const onFormSubmit = (values: TodoFormValues) => {
    onSubmit(values.title);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex gap-2">
      <div className="flex-1">
        <Input placeholder="Add a new todo..." {...register("title")} />
        {errors.title && (
          <p className="mt-1 text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>
      <Button type="submit">Add</Button>
    </form>
  );
}
