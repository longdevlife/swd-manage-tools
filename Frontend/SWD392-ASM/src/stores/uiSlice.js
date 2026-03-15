// stores/uiSlice.js
// Global UI state — active group, sidebar, modals
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeGroupId: null,     // Group đang được chọn/làm việc
  sidebarCollapsed: false, // Sidebar thu gọn hay không
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveGroup: (state, action) => {
      state.activeGroupId = action.payload;
    },
    clearActiveGroup: (state) => {
      state.activeGroupId = null;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { setActiveGroup, clearActiveGroup, toggleSidebar, setSidebarCollapsed } = uiSlice.actions;

// Selectors
export const selectActiveGroupId = (state) => state.ui.activeGroupId;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;

export default uiSlice.reducer;
