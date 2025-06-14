import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { UIMessage } from "ai";

export function ShareChatClient({
  initialMessages,
  title,
  author
}: {
  initialMessages: UIMessage[];
  title: string;
  author: string;
}) {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">Shared by: <span className="font-medium">{author}</span></p>

      {initialMessages.map((m) => {
        if (m.role === "user") {
          const text = m.parts
            ?.map((p: any) => (p.type === "text" ? p.text : ""))
            .join("");
          return (
            <div key={m.id} className="flex justify-end">
              <div className="px-4 py-2 border rounded-2xl bg-background">
                <p className="text-sm">{text}</p>
              </div>
            </div>
          );
        }

        // assistant
        let content = "";
        m.parts?.forEach((p: any) => {
          if (p.type === "text") content += p.text;
        });

        return (
          <div key={m.id} className="flex justify-start">
            <div className="prose">
              <MemoizedMarkdown content={content} id={m.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}