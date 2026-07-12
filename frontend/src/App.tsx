import Landing from "./Landing";
import Login from "./Login";
import Signup from "./Signup";
import Admin from "./Admin";
import Review from "./Review";
import Record from "./Record";
import Dashboard from "./Dashboard";
import MyRecord from "./MyRecord";
import StartTrial from "./StartTrial";

function App() {
  const path = window.location.pathname;

  if (path === "/login") return <Login />;
  if (path === "/signup") return <Signup />;
  if (path === "/admin") return <Admin />;
  if (path === "/review") return <Review />;
  if (path === "/dashboard") return <Dashboard />;
  if (path === "/my-record") return <MyRecord />;
  if (path === "/start-trial") return <StartTrial />;
  if (path.startsWith("/r/")) return <Record />;
  return <Landing />;
}

export default App;
