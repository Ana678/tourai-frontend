import { ReactNode } from "react";
import Header from "./Header";

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default MobileLayout;
