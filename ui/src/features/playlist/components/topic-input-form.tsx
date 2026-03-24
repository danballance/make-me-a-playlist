import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v3";

const topicSchema = z.object({
  topic: z
    .string()
    .min(1, "Please enter a topic")
    .refine((val) => val.trim().length > 0, "Please enter a topic"),
});

type TopicFormValues = z.infer<typeof topicSchema>;

interface TopicInputFormProps {
  onSubmit: (topic: string) => void;
  isSubmitting: boolean;
}

export function TopicInputForm({
  onSubmit,
  isSubmitting,
}: TopicInputFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { topic: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values.topic))}
      className="flex flex-col gap-4 w-full"
    >
      <div className="flex flex-col gap-1.5 w-full">
        <input
          type="text"
          placeholder='e.g. "advanced vim motions"'
          className="w-full rounded-2xl border border-[#FECACA] bg-white px-[18px] py-[14px] text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
          {...register("topic")}
        />
        {errors.topic && (
          <span className="text-xs text-[#DC2626] px-1">
            {errors.topic.message}
          </span>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#DC2626] px-7 py-3 text-sm font-medium text-[#fafafa] hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Starting..." : "Find my playlist"}
      </button>
    </form>
  );
}
