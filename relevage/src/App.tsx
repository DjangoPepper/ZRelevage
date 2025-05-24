import React from 'react';
import TableManager from './components/TableManager';

const App: React.FC = () => {
    return (
        <div className="App">
            <h1 style={{ textAlign: 'center' }}>Relevage</h1>
            <TableManager />
        </div>
    );
};

export default App;