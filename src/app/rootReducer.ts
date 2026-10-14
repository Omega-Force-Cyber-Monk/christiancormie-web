import { combineReducers } from "@reduxjs/toolkit";

import { authReducer } from "@/features/auth/store/auth.slice";
import { baseApi } from "@/services/api/baseApi";

export const rootReducer = combineReducers({
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
