import { Check } from "lucide-react";
export default function Brand() {
  return (
    <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
        <Check size={23} strokeWidth={3} />
      </span>
      Taskflow<span className="text-blue-600">.</span>
    </div>
  );
}
