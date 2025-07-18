import React from 'react';
import WebcamComponent from './WebcamComponent'; // Kendi bileşenimizi içeri aktarıyoruz
import './App.css'; // Stil dosyasını dahil ediyoruz

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Webcam Test Projesi</h1>
      </header>
      <main>
        <WebcamComponent /> {/* Webcam bileşenimizi buraya yerleştiriyoruz */}
      </main>
    </div>
  );
}

export default App;