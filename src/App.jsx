import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import UserLayout from "./components/UserLayout";
import LoginPage from "./pages/Login";
import HomePage from "./pages/admin/HomePage";
import OkQualityList   from "./pages/ok-quality/OkQualityList";
import OkQualityForm   from "./pages/ok-quality/OkQualityForm";
import OkQualityDetail from "./pages/ok-quality/OkQualityDetail";
import AdminLogs from "./pages/admin/AdminLogs";
import NotFound404 from "./pages/404NotFound";
import ForbiddenPage from "./pages/Forbidden";
import checkSession from "./helpers/ChecksSession";

// ===== require auth =====
async function requireAuth() {
  const session = await checkSession();
  if (!session) {
    return redirect("/login");
  }
  return null;
}

const router = createBrowserRouter([
  {
    path: "/forbidden",
    element: <ForbiddenPage />,
  },

  {
    path: "/login",
    element: <LoginPage />,
    loader: async () => {
      const session = await checkSession();
      if (session) return redirect("/home");
      return null;
    },
  },

  {
    element: <UserLayout />,
    loader: requireAuth,
    children: [
      { path: "/home", element: <HomePage /> },

      // ── OK Quality ──────────────────────────────────────────
      { path: "/ok-quality",              element: <OkQualityList /> },
      { path: "/ok-quality/form",         element: <OkQualityForm /> },
      { path: "/ok-quality/form/:id",     element: <OkQualityForm /> },
      { path: "/ok-quality/:id",          element: <OkQualityDetail /> },

      // ── Admin ────────────────────────────────────────────────
      { path: "/admin/logs",              element: <AdminLogs /> },

      { path: "*", element: <NotFound404 /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
