import React from "react";
import { motion } from "framer-motion";

export const ConversationHeader = ({
  title,
  subtitle,
  avatarLetter,
  onVoiceCall,
  onVideoCall,
  callDisabled = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 border-b shadow-sm bg-white/80 backdrop-blur-md"
    >
      {/* Left side: avatar + info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full shadow-md bg-gradient-to-br from-blue-500 to-purple-500">
          {avatarLetter}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      {/* Right side: call buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={!callDisabled ? { scale: 1.05 } : {}}
          whileTap={!callDisabled ? { scale: 0.95 } : {}}
          onClick={!callDisabled ? onVoiceCall : undefined}
          disabled={callDisabled}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition shadow rounded-xl 
            ${callDisabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-teal-500 hover:shadow-lg"}`}
        >
          🎤 Voice
        </motion.button>

        <motion.button
          whileHover={!callDisabled ? { scale: 1.05 } : {}}
          whileTap={!callDisabled ? { scale: 0.95 } : {}}
          onClick={!callDisabled ? onVideoCall : undefined}
          disabled={callDisabled}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition shadow rounded-xl 
            ${callDisabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg"}`}
        >
          📹 Video
        </motion.button>
      </div>
    </motion.div>
  );
};
