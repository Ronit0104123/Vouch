import Landing from "./Landing";
import Login from "./Login";
import Admin from "./Admin";

function App() {
  const path = window.location.pathname;

  if (path === "/login") return <Login />;
  if (path === "/admin") return <Admin />;
  return <Landing />;
}

export default App;
