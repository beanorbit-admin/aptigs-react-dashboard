import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('aptigs_token') || null,
    role: localStorage.getItem('aptigs_role') || null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.role = action.payload.role
      localStorage.setItem('aptigs_token', action.payload.token)
      localStorage.setItem('aptigs_role', action.payload.role)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.role = null
      localStorage.removeItem('aptigs_token')
      localStorage.removeItem('aptigs_role')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
