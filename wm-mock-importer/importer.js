const fs = require('fs');
const path = require('path');
const axios = require('axios');

const wiremockUrl = 'http://localhost:8080/__admin/mappings/import';
const mocksDirectory = './mappings';

/**
 * reads JSON files in the directory and its subdirectories.
 * @param {string} dir - target dir
 * @returns {Promise<string[]>} - absolute file paths list
 */
async function getJsonFiles(dir) {
    const files = await fs.promises.readdir(dir);
    const jsonFiles = [];

    //recursive search on target dirtectory
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isDirectory()) {
            const nestedFiles = await getJsonFiles(filePath);
            jsonFiles.push(...nestedFiles);
        } else if (path.extname(file) === '.json') {
            jsonFiles.push(filePath);
        }
    }

    return jsonFiles;
}

/**
 * Imports mocks to wm
 * @param {string[]} files - list of mock file paths
 */
async function importMocks(files) {
    for (const file of files) {
        try {
            console.log(`Processing file: ${file}`);
            const content = await fs.promises.readFile(file, 'utf-8');
            let data = JSON.parse(content);

            // normalize the data structure an arr of mappings
            if (!Array.isArray(data.mappings)) {
                data = { mappings: [data] }; // Wrap single mapping in an array
            }

            // send the mappings to WM
            await axios.post(wiremockUrl, data);
            console.log(`Successfully imported mappings from: ${file}`);
        } catch (error) {
            console.error(`Error processing file: ${file}`);
            console.error(error.message);
        }
    }
}

(async () => {
    try {
        console.log('Scanning for mock files...');
        const files = await getJsonFiles(mocksDirectory);
        if (files.length === 0) {
            console.log('No files found.');
            return;
        }

        console.log(`Found ${files.length} mock file(s). importiong to WM...`);
        await importMocks(files);
        console.log('All mock files have been imported successfully.');
    } catch (error) {
        console.error('An error occurred while scaning or importing mock files:');
        console.error(error.message);
    }
})();
