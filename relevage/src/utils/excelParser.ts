import * as XLSX from 'xlsx';

export const parseExcel = (file: File): Promise<{ sheetNames: string[], data: any[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const binaryStr = event.target?.result;
            if (typeof binaryStr === 'string') {
                const workbook = XLSX.read(binaryStr, { type: 'binary' });
                const sheetNames = workbook.SheetNames; // Liste des noms de feuilles

                // Par défaut, on retourne les noms des feuilles et aucune donnée
                resolve({ sheetNames, data: [] });
            } else {
                reject(new Error('Invalid file format'));
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsBinaryString(file);
    });
};

export const parseSheet = (file: File, sheetName: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const binaryStr = event.target?.result;
            if (typeof binaryStr === 'string') {
                const workbook = XLSX.read(binaryStr, { type: 'binary' });
                const worksheet = workbook.Sheets[sheetName];
                if (worksheet) {
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } else {
                    reject(new Error(`Sheet "${sheetName}" not found`));
                }
            } else {
                reject(new Error('Invalid file format'));
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsBinaryString(file);
    });
};