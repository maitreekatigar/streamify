import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import { logout } from "../lib/api";

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      const apiKey = import.meta.env.VITE_STREAM_API_KEY;
      if (apiKey) {
        const client = StreamChat.getInstance(apiKey);
        if (client.userID) await client.disconnectUser();
      }
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;
