import { PermissionValue } from "@/types/permission"; 
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  permission: {
    permissions: PermissionValue;
  };
  status: string;
  token: string;
}

const initialState: {
  user: User | null;
  isAuthenticated: boolean;
} = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
