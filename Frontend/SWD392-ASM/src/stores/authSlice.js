import { createSlice } from '@reduxjs/toolkit';

const loadFromStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('accessToken');
    return { user, token, isAuthenticated: !!token };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadFromStorage(),
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', token);
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => {
  const user = state.auth.user;
  // Support both normalized 'role' string and original 'roles' array from BE
  return user?.role ?? user?.roles?.[0] ?? null;
};
export const selectUserRoles = (state) => state.auth.user?.roles ?? [];

export default authSlice.reducer;
