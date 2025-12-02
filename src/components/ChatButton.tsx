import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function ChatButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  // Don't show the button if we're already on the chat page
  if (location.pathname === "/chat") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => navigate("/chat")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary to-primary-glow hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg whitespace-nowrap text-sm">
          Chat with assistant
        </div>
      )}
    </div>
  );
}