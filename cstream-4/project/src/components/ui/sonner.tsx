import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      offset={24}
      gap={8}
      duration={4000}
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/40 group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:border-green-500/40 group-[.toaster]:bg-green-950/90 group-[.toaster]:backdrop-blur-xl",
          error: "group-[.toaster]:border-red-500/40 group-[.toaster]:bg-red-950/90 group-[.toaster]:backdrop-blur-xl",
          warning: "group-[.toaster]:border-yellow-500/40 group-[.toaster]:bg-yellow-950/90 group-[.toaster]:backdrop-blur-xl",
          info: "group-[.toaster]:border-blue-500/40 group-[.toaster]:bg-blue-950/90 group-[.toaster]:backdrop-blur-xl",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
