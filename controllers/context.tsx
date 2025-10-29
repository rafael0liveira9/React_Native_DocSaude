import React, { createContext, ReactNode, useState } from "react";

type ThemeContextType = {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  cards: any[];
  setCards: React.Dispatch<React.SetStateAction<any[]>>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const DocSaudeContainer = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);

  return (
    <ThemeContext.Provider value={{ user, setUser, cards, setCards }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
