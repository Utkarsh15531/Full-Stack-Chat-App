import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import IncomingCall from "../components/IncomingCall";
import VideoCall from "../components/VideoCall";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { activeCall, endCall } = useCallStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
      
      {/* Global incoming call overlay */}
      <IncomingCall />
      
      {/* Active call overlay */}
      {activeCall && (
        <VideoCall
          callType={activeCall.callType}
          isIncoming={activeCall.isIncoming}
          caller={activeCall.isIncoming ? { _id: activeCall.participantId } : null}
          onEnd={() => endCall(activeCall.callId, activeCall.participantId)}
        />
      )}
    </div>
  );
};
export default HomePage;
