import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { createSessionMutation } from "@/features/playlist/queries";
import { TopicInputForm } from "@/features/playlist/components/topic-input-form";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();

  const mutation = useMutation({
    ...createSessionMutation(),
    onSuccess: (data) => {
      navigate({
        to: "/conversation/$sessionId",
        params: { sessionId: data.session_id },
      });
    },
  });

  const handleSubmit = (topic: string) => {
    mutation.mutate({ body: { topic } });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen px-6">
      <div className="flex flex-col items-center gap-8 w-[480px] max-w-full">
        <div className="flex flex-col items-center gap-3 w-full">
          <h1 className="text-[36px] font-semibold text-[#1F2937] tracking-[-0.5px] leading-[1.05] text-center">
            Make me a playlist
          </h1>
          <p className="text-sm font-medium text-[#6B7280] leading-[1.5] text-center max-w-[400px]">
            Describe a topic or theme — our AI agent will dig through YouTube to
            find hidden gems just for you.
          </p>
        </div>
        <TopicInputForm
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
        />
        {mutation.isError && (
          <p className="text-sm text-[#DC2626]">
            Failed to create session. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
