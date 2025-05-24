import React, { useState } from 'react';
import { parseExcel } from '../utils/excelParser';

const TableManager: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        parseExcel(file)
            .then(parsedData => {
                setSheetNames(parsedData.sheetNames); // Set the sheet names
                setData(parsedData.data); // Set the data (initially empty)
                setError(null);
            })
            .catch(err => {
                setError('Failed to parse the Excel file.');
                console.error(err);
            });
    };

    return (
        <div>
            <h1>Table Manager</h1>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {sheetNames.length > 0 && (
                <div>
                    <h2>Available Sheets:</h2>
                    <ul>
                        {sheetNames.map(sheetName => (
                            <li key={sheetName}>{sheetName}</li>
                        ))}
                    </ul>
                </div>
            )}
            {data.length > 0 && (
                <table style={{ border: '1px solid black', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {Object.keys(data[0]).map(key => (
                                <th key={key}>{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                {Object.values(row).map((value, i) => (
                                    <td key={i}>{value}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TableManager;