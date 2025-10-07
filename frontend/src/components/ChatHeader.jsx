import { X } from "lucide-react"; // 'X' is an symbol here used for "close button", generally in the top right corner
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import MessageSearch from "./MessageSearch";
import { CallButtons } from "./VideoCall";
import { formatLastSeen } from "../lib/utils";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall } = useCallStore();
  
  const isOnline = onlineUsers.includes(selectedUser._id);
  const getStatusText = () => {
    if (isOnline) {
      return "Online";
    } else if (selectedUser.lastSeen) {
      return formatLastSeen(selectedUser.lastSeen);
    } else {
      return "Offline";
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              {/* Online indicator */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-white"></span>
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Call buttons */}
          <CallButtons onCall={(type) => initiateCall(selectedUser._id, type)} />
          
          {/* Search component */}
          <MessageSearch />
          
          {/* Close button */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-base-200 rounded-lg transition-colors"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
