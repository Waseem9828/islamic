
import { cn } from "@/lib/utils";

export const LoadingScreen = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] w-full bg-background/50">
        <div className="loader"></div>
        <p className="text-sm text-muted-foreground mt-4">{text}</p>
    </div>
  );
};
