const fs = require('fs');
const path = require('path');
const inputDir = './mappings/products';
const outputSearchDir = './mappings/search';
const outputDataDir = './mappings/data';
const outputMediaDir = './mappings/media';

if (!fs.existsSync(outputSearchDir)) {
    fs.mkdirSync(outputSearchDir, { recursive: true });
}
if (!fs.existsSync(outputDataDir)) {
    fs.mkdirSync(outputDataDir, { recursive: true });
}
if (!fs.existsSync(outputMediaDir)) {
    fs.mkdirSync(outputMediaDir, { recursive: true });
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let mocks = JSON.parse(content);
    const baseFileName = path.basename(filePath, '.json');

  //sometimes files have a single mock sometimes it a "mappings" array, so lets handle such case
    if (Array.isArray(mocks.mappings)) {
      
       //lets preserve the file name and structure in the output data
        const transformedMappings = mocks.mappings.map((mapping, index) => transformMappings(mapping, index, baseFileName));
      
        const searchFileName = `${baseFileName}.json`;
        const searchOutputFile = path.join(outputSearchDir, searchFileName);
        fs.writeFileSync(searchOutputFile, JSON.stringify({ mappings: transformedMappings.map(m => m.search) }, null, 2));

        const dataMappings = transformedMappings.filter(m => m.data).map(m => m.data);
        if (dataMappings.length > 0) {
            const dataFileName = `${baseFileName}.json`;
            const dataOutputFile = path.join(outputDataDir, dataFileName);
            fs.writeFileSync(dataOutputFile, JSON.stringify({ mappings: dataMappings }, null, 2));
            console.log(`Saved data mapping to ${dataOutputFile}`);
        } else {
            console.log(`No data mapping saved for ${path.basename(filePath)} due to empty content`);
        }
      
        const mediaMappings = transformedMappings.filter(m => m.media).map(m => m.media);
        if (mediaMappings.length > 0) {
            const mediaFileName = `${baseFileName}.json`;
            const mediaOutputFile = path.join(outputMediaDir, mediaFileName);
            fs.writeFileSync(mediaOutputFile, JSON.stringify({ mappings: mediaMappings }, null, 2));
            console.log(`Saved data mapping to ${mediaOutputFile}`);
        } else {
            console.log(`No media mapping saved for ${path.basename(filePath)} due to empty content`);
        }

    } else {
        const newMappings = transformMappings(mocks, 0, baseFileName);
        const searchFileName = `${baseFileName}.json`;
        const searchOutputFile = path.join(outputSearchDir, searchFileName);
        fs.writeFileSync(searchOutputFile, JSON.stringify(newMappings.search, null, 2));
        console.log(`Saved search mapping to ${searchOutputFile}`);
        if (newMappings.data) {
            const dataFileName = `${baseFileName}.json`;
            const dataOutputFile = path.join(outputDataDir, dataFileName);
            fs.writeFileSync(dataOutputFile, JSON.stringify(newMappings.data, null, 2));
            console.log(`Saved data mapping to ${dataOutputFile}`);
        } else {
            console.log(`No data mapping saved for ${baseFileName} due to empty content`);
        }
        if (newMappings.media) {
            const mediaFileName = `${baseFileName}.json`;
            const mediaOutputFile = path.join(outputMediaDir, mediaFileName);
            fs.writeFileSync(mediaOutputFile, JSON.stringify(newMappings.media, null, 2));
            console.log(`Saved media mapping to ${outputMediaDir}`);
        } else {
            console.log(`No media mapping saved for ${baseFileName} due to empty content`);
        }
    }
}

function transformMappings(src, index, baseFileName) {
    console.log("STARTED TO PROCESS ", baseFileName, index);
    if (!src.response.jsonBody || (Object.keys(src.response.jsonBody).length === 0)) {
        return {
            search: {
                request: {
                    method: src.request.method,
                    urlPathPattern: "/path",
                    cookies: src.request.cookies,
                    bodyPatterns: src.request.bodyPatterns
                },
                response: {
                    status: src.response.status,
                    headers: src.response.headers
                }
            }
        };
    }
    const products = src.response.jsonBody.content;
    const productIds = products ? products.map(product => product.ProductId) : [];
    const bodyPattern = [
        {
            matchesJsonPath: createMatchesJsonPath(productIds.slice(0, 3))
        }
    ];
    const search = {
        priority: src.priority,
        request: {
            method: src.request.method,
            urlPathPattern: "/search",
            cookies: src.request.cookies,
            bodyPatterns: src.request.bodyPatterns
        },
        response: {
            status: src.response.status,
            jsonBody: {
                totalCount: src.response.jsonBody.totalCount,
                sorts: src.response.jsonBody.sorts,
                content: productIds ? productIds : []
            },
            headers: src.response.headers
        }
    };
    const data = {
        priority: src.priority,
        request: {
            method: src.request.method,
            urlPathPattern: "/data",
            cookies: src.request.cookies,
            bodyPatterns: bodyPattern
        },
        response: {
            status: 200,
            jsonBody: {
                content: products,
            },
            headers: src.response.headers
        }
    };
    const media = {
        priority: src.priority,
        request: {
            method: src.request.method,
            urlPathPattern: "/media",
            cookies: src.request.cookies,
            bodyPatterns: bodyPattern
        },
        response: {
            status: 200,
            jsonBody: {
                data: {}
            },
            headers: src.response.headers
        }
    };
    return { search, data, media };
};

//some json path bs
function createMatchesJsonPath(productIds) {
    const idConditions = pIds.map(id => `@ == '${id}'`).join(' || ');
    return `$.pIds[?(${idConditions})]`;
}

function processDirectory(directory) {
    const items = fs.readdirSync(directory);
    for (const item of items) {
        const itemPath = path.join(directory, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            processDirectory(itemPath);
        } else if (item.endsWith('.json')) {
            processFile(itemPath);
        }
    }
}

processDirectory(inputDir);
