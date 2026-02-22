import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const { copy, copied } = useCopyToClipboard();
  return (
    <button onClick={() => copy(text)} className={`text-xs px-2 py-1 rounded transition ${copied ? 'text-green-400 bg-green-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'} ${className}`} title="Copy to clipboard">
      {copied ? '✓ Copied' : '⎘ Copy'}
    </button>
  );
}