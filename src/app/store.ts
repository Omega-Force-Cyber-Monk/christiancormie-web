import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { authSessionMiddleware } from "@/features/auth/store/auth.middleware";
import { rootReducer } from "@/app/rootReducer";
import { baseApi } from "@/services/api/baseApi";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authSessionMiddleware, baseApi.middleware),
  devTools: import.meta.env.DEV,
});

setupListeners(store.dispatch);

export type { RootState } from "@/app/rootReducer";
export type AppDispatch = typeof store.dispatch;
