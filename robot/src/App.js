import React from "react";
import "./App.css";
import Player from "./Player";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Player size={200} speed={280} />
      </header>
    </div>
  );
}

export default App;
