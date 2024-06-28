import { persist } from "zustand/middleware";
import { create } from "zustand";

interface LoginState {
  username: string;
  password: string;
  isLoggedIn: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
}

// Create the store
const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      username: "",
      password: "",
      isLoggedIn: false,
      login: (username, password) => {
        // Perform login logic here
        // For example, send a request to the server to validate the credentials
        // If the credentials are valid, set isLoggedIn to true
        set({ username, password, isLoggedIn: true });
      },
      logout: () => {
        // Perform logout logic here
        // Clear the saved credentials and set isLoggedIn to false
        set({ username: "", password: "", isLoggedIn: false });
      },
    }),
    {
      name: "login-storage", // name of the item in the storage (must be unique)
      getStorage: () => localStorage, // specify where to store the data (localStorage in this case)
    },
  ),
);

export default useLoginStore;
