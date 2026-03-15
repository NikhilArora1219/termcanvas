import { useEffect, useMemo } from 'react';
import Canvas from './Canvas';
import { SplitLayout } from './components/SplitLayout';
import { TitleBar } from './components/TitleBar';
import { NodeServicesRegistryProvider, ThemeProvider } from './context';
import { createServiceFactories, sharedEventDispatcher } from './services';
import './App.css';

function App() {
  // Create service factories once
  const factories = useMemo(() => createServiceFactories(), []);

  // Initialize shared event dispatcher (single IPC listener for all agent events)
  useEffect(() => {
    sharedEventDispatcher.initialize();
    return () => sharedEventDispatcher.dispose();
  }, []);

  return (
    <ThemeProvider>
      <NodeServicesRegistryProvider factories={factories}>
        <div className="app">
          <TitleBar />
          <div className="app-content">
            <SplitLayout>
              <Canvas />
            </SplitLayout>
          </div>
        </div>
      </NodeServicesRegistryProvider>
    </ThemeProvider>
  );
}

export default App;
