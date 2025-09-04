import * as XLSX from 'xlsx';

// This parser's only job is to log the structure of the uploaded file.
export const parseSorSochAnalysis = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Не удалось прочитать файл.");
        }

        const workbook = XLSX.read(data, { type: "buffer" });
        
        console.log("--- SOR/SOCH Analysis Parser ---");

        workbook.SheetNames.forEach(sheetName => {
            console.log(`--- Parsing Sheet: ${sheetName} ---`);
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            console.log(`Raw JSON data for sheet ${sheetName}:`, JSON.stringify(jsonData, null, 2));
        });

        resolve();

      } catch (err: any) {
        console.error("Критическая ошибка парсинга документа анализа СОР/СОЧ:", err);
        reject(err.message || "Не удалось обработать файл.");
      }
    };

    reader.onerror = () => {
      reject(new Error("Ошибка чтения файла."));
    };

    reader.readAsArrayBuffer(file);
  });
};
