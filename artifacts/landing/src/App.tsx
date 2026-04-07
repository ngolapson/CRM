import LandingPage from "@/pages/LandingPage";
import AdminPage from "@/pages/AdminPage";

function App() {
  const path = window.location.pathname;
  if (path.includes("/admin")) {
    return <AdminPage />;
  }
  return <LandingPage />;
}

export default App;
