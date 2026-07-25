import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../slices/authSlice';

export const dukaan = configureStore({
  reducer: {
    auth: authReducer
  }
});
