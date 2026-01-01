import { motion } from "framer-motion";

function EditorFooter({ activeUsers }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#121212] mt-4 p-2 rounded shadow text-white flex flex-wrap items-center gap-2 text-sm border border-gray-700"
    >
      👥 Active Users:
      {activeUsers.length ? (
        [...activeUsers]
          .sort((a, b) => a.username.localeCompare(b.username))
          .map((u, i) => {
            const isSelf =
              u.username === localStorage.getItem("username");

            return (
              <span
                key={u.id || i}
                className={`px-2 py-1 rounded-full font-medium ${
                  isSelf
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {u.username || "Guest"} {isSelf && "(You)"}
              </span>
            );
          })
      ) : (
        <span className="ml-2 text-gray-400">None</span>
      )}
    </motion.div>
  );
}

export default EditorFooter;
