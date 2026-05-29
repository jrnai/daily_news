import { useState } from "react";
import { AdminPage } from "./pages/AdminPage.jsx";
import { NewsDashboard } from "./features/news/NewsDashboard.jsx";

export default function App() {
  const [page, setPage] = useState("news");

  if (page === "admin") return <AdminPage onBack={() => setPage("news")} />;
  return <NewsDashboard onAdmin={() => setPage("admin")} />;
}
