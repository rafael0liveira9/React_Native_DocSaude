import React, { createContext, ReactNode, useState } from "react";

type ThemeContextType = {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const DocSaudeContainer = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  return (
    <ThemeContext.Provider value={{ user, setUser }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
