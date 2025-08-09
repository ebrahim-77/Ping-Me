import { MessagesSquare, UsersRound } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessagesSquare className="w-8 h-8 text-primary " />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold">Welcome to Ping Me</h2>
        <p className="text-base-content/60">
          Select a conversation from the sidebar to start chatting
        </p>
        
        {/* Group Chat Instructions */}
        <div className="mt-8 p-4 bg-base-200 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <UsersRound className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-lg font-semibold">Group Chats</h3>
          </div>
          <p className="text-sm text-base-content/80">
            Switch to the Groups tab in the sidebar and click "Create Group" to start a new group chat.
            You can add members and chat with multiple people at once!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;