import { useEffect } from "react";

export function useActiveUsers({
  roomId,
  socketRef,
  setActiveUsers,
}) {
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    const handleActiveUsersUpdate = (users) => {
      setActiveUsers(users);
    };

    socket.on("active-users-update", handleActiveUsersUpdate);
    return () =>
      socket.off("active-users-update", handleActiveUsersUpdate);
  }, [roomId, setActiveUsers]);
}
