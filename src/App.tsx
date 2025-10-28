import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./modules/home/pages/Dashboard";
import "./App.css";
import Layout from "./components/layout/Layout";
import TrackStatus from "./modules/home/pages/TrackStatus";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="ticket-status" element={<TrackStatus />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
