import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ShortcutAction } from "@/hooks/useKeyboardShortcuts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: ShortcutAction[];
}

const formatKey = (s: ShortcutAction) => {
  const parts: string[] = [];
  if (s.ctrl) parts.push("Ctrl");
  if (s.shift) parts.push("Shift");
  if (s.alt) parts.push("Alt");
  parts.push(s.key.length === 1 ? s.key.toUpperCase() : s.key);
  return parts.join("+");
};

const categories = ["Navigation", "Actions", "UI Controls", "Data Operations"] as const;

const ShortcutsHelp = ({ open, onOpenChange, shortcuts }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {categories.map((cat) => {
            const items = shortcuts.filter((s) => s.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {cat}
                </h3>
                <div className="space-y-1.5">
                  {items.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-sm text-foreground">{s.label}</span>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        {formatKey(s)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsHelp;
