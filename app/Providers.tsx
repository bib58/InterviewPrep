"use client";

import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { ThemeProvider } from "../components/ui/Theme-provider";
import { dukaan } from "../components/store/store";
import { checkAuth } from "../slices/authSlice";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<any>();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={dukaan}>
      <AuthInitializer>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </AuthInitializer>
    </Provider>
  );
}