import { useState, useEffect, useRef, useMemo } from 'react';

interface AutocompleteProps {
  items: any[];
  displayKey: string;
  value: string;
  onChange: (val: string) => void;
  onSelect: (item: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Autocomplete({ items, displayKey, value, onChange, onSelect, placeholder, className, id, inputRef, onKeyDown }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (!value) return [];
    const valLower = value.toLowerCase();
    return items.filter(item => 
      item[displayKey]?.toLowerCase().includes(valLower)
    ).slice(0, 5);
  }, [items, value, displayKey]);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredItems[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: any) => {
    onChange(item[displayKey]);
    onSelect(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        id={id}
        ref={inputRef}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {isOpen && filteredItems.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredItems.map((item, index) => (
            <li
              key={item._id || index}
              className={`px-4 py-2 cursor-pointer text-sm ${
                index === highlightedIndex ? 'bg-blue-600 text-white' : 'hover:bg-blue-600 hover:text-white text-gray-700'
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(item)}
            >
              {item[displayKey]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
