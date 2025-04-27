"use client"

// This file is marked as a client component to enable client-side rendering.
// Learn more: https://react.dev/reference/react/use-client
import Sidebar from "@/components/Sidebar"
import MyComponent from '@/components/MyComponent'

export default function Page() {
  return (
    <div>
      <Sidebar />
      <MyComponent />
    </div>
  );
}