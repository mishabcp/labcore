import * as React from "react";
import { cn } from "@/lib/utils";

type SelectContextType = {
    value: string;
    onValueChange: (val: string) => void;
};
const SelectContext = React.createContext<SelectContextType | null>(null);

export const Select = ({ children, value, onValueChange }: any) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
        <div className="relative inline-block w-full text-sm">{children}</div>
    </SelectContext.Provider>
);

export const SelectValue = ({ placeholder }: any) => null;
export const SelectTrigger = ({ children }: any) => null;

export const SelectContent = ({ children }: any) => {
    const ctx = React.useContext(SelectContext);
    return (
        <select
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed"
            )}
            value={ctx?.value || ""}
            onChange={(e: any) => ctx?.onValueChange?.(e.target.value)}
        >
            <option value="" disabled>Select an option</option>
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;
                return child;
            })}
        </select>
    );
};

export const SelectItem = ({ children, value }: any) => (
    <option value={value}>{children}</option>
);
