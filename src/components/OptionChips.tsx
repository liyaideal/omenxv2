interface Option {
  id: string;
  label: string;
  price: string;
}

interface OptionChipsProps {
  options: Option[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const OptionChips = ({ options, selectedId, onSelect }: OptionChipsProps) => {
  return (
    <div className="flex gap-2 px-4 py-1 overflow-x-auto scrollbar-hide">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-center transition-all duration-200 active:scale-95 ${
            selectedId === option.id
              ? "bg-trading-purple/15 border border-trading-purple"
              : "bg-muted/50 border border-transparent"
          }`}
        >
          <div className={`font-medium text-xs ${selectedId === option.id ? "text-foreground" : "text-muted-foreground"}`}>
            {option.label}
          </div>
          <div className={`font-mono text-xs ${
            selectedId === option.id ? "text-trading-purple" : "text-muted-foreground"
          }`}>
            ${option.price}
          </div>
        </button>
      ))}
    </div>
  );
};