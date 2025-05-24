import React, { useState } from 'react';
import { parseExcel } from '../utils/excelParser';

const TableManager: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            parseExcel(file)
                .then(parsedData => {
                    setData(parsedData);
                    setError(null);
                })
                .catch(err => {
                    setError('Error parsing file: ' + err.message);
                    setData([]);
                });
        }
    };

    return (
        <div>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {data.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            {Object.keys(data[0]).map((key) => (
                                <th key={key}>{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                {Object.values(row).map((value, idx) => (
                                    <td key={idx}>{value}</td>
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