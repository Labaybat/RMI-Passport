import React from "react"
import ReactDOM from "react-dom/client"
import { Toaster } from "react-hot-toast"
import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router"

import "./index.css"
import { LoginPage } from "./components/LoginPage"
import { SignUpPage } from "./components/SignUpPage"
import PassportDashboard from "./components/Dashboard"
import MyProfile from "./components/MyProfile"
import Application from "./components/Application"
import { AuthProvider } from "./contexts/AuthContext"
import PhotoGuideline from "./components/photoguideline"

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  ),
})

// Individual routes
const loginRoute = createRoute({
  path: "/login",
  getParentRoute: () => rootRoute,
  component: LoginPage,
})

const signupRoute = createRoute({
  path: "/signup",
  getParentRoute: () => rootRoute,
  component: SignUpPage,
})

const indexRoute = createRoute({
  path: "/",
  getParentRoute: () => rootRoute,
  component: LoginPage, // Default path goes to login
})

const dashboardRoute = createRoute({
  path: "/dashboard",
  getParentRoute: () => rootRoute,
  component: PassportDashboard,
})

const myProfileRoute = createRoute({
  path: "/my-profile",
  getParentRoute: () => rootRoute,
  component: MyProfile,
})

const applicationRoute = createRoute({
  path: "/apply",
  getParentRoute: () => rootRoute, // Specify the parent route
  component: Application,
})

const photoGuidelineRoute = createRoute({
  path: "/photo-guidelines",
  getParentRoute: () => rootRoute,
  component: PhotoGuideline,
})

// Router setup
const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    loginRoute,
    signupRoute,
    dashboardRoute,
    myProfileRoute,
    applicationRoute,
    photoGuidelineRoute,
  ]),
})

// Render the app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)
