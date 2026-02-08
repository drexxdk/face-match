interface DividerProps {
  text?: string;
}

export function Divider({ text = 'Or continue with' }: DividerProps) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background text-muted-foreground px-2">{text}</span>
      </div>
    </div>
  );
}
