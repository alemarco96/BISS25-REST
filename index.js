const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Automatically read the body of requests in JSON format.
app.use(express.json());

// Redirect to the public folder any request not of the specified types.
app.use("/", express.static("./public"));


// Define the base URL used in this project.
const BASE_URL = "/api/v1";

// --------------------------------------------------------------------------------
// Define the variables containing the data for the project.

// Regular expressions used in the analysis of textual documents.
const SEP_REGEX = /[^A-Za-z0-9]+/g;
const SPACE_REGEX = /[ ]+/g;

// Hyperparameters of BM25 scoring function.
const BM25_K1 = 1.2;
const BM25_B = 0.75;


// Store the data associated with each document.
const _docs_data = new Map();
// Auxilliary data structure used during search phase.
const _inverted_index = new Map();
// Store the sum of length of every document in the collection.
let _sum_length = 0;


// --------------------------------------------------------------------------------
// Define the auxilliary functions used in the project.

// Split a textual document into a sequence of words.
function analyze_document(doc_text) {
    console.log(doc_text);
    doc_text = doc_text.replaceAll(SEP_REGEX, " ");
    console.log(doc_text);
    doc_text = doc_text.replaceAll(SPACE_REGEX, " ");
    console.log(doc_text);
    const words = doc_text.split(" ");
    console.log(JSON.stringify(words), typeof(words), words.length);

    const doc_words = new Map();
    for (let k of words) {
        let freq = doc_words.get(k);
        if (freq === undefined) { freq = 0; }
        freq += 1;

        console.log(`\t${k}: ${typeof(k)} => ${freq}: ${typeof(freq)}`);

        doc_words.set(k, freq);
        console.log(doc_words, JSON.stringify(doc_words));
    }
    console.log(JSON.stringify(doc_words));

    const result = new Map();
    result.set("text", doc_text);
    result.set("words", doc_words);
    result.set("length", words.length);
    console.log(result, JSON.stringify(result));

    return result;

    /*
    return {
        text: doc_text,
        words: doc_words,
        length: words.length
    };
    */
};


// Compute the TF part of the BM25 scoring.
function tf(f, l, avg_l) {
    console.log(`** TF **`, f, l, avg_l, BM25_K1, BM25_B);
    console.log(f * (BM25_K1 + 1), (1 - BM25_B + BM25_B * (l / avg_l)));
    console.log(f + BM25_K1 * (1 - BM25_B + BM25_B * (l / avg_l)));
    return (f * (BM25_K1 + 1)) / (f + BM25_K1 * (1 - BM25_B + BM25_B * (l / avg_l)));
}


// Compute the IDF part of the BM25 scoring.
function idf(n, N) {
    return Math.log2(1 + ((2 * (N - n) + 1) / (2 * (n) + 1)));
}


function printMap(x) {
    for (let [k, v] of x) {
        console.log(`${k} => ${v}`);
    }
}

// --------------------------------------------------------------------------------

// Post a new document.
app.post(`${BASE_URL}/docs`, (req, res) => {
    try {
        // Extract the input data from the request body.
        const doc_id = req.body.doc_id;
        const doc_text = req.body.doc_text;

        console.log(`POST /docs: ${doc_id} = ${doc_text}`);

        // Determine whether a document with the same id does already exist.
        if (_docs_data.has(doc_id)){
            res.sendStatus(409, `The document ${doc_id} already exists.`);
            return;
        }

        console.log(`\tDocument ${doc_id} is novel`);

        // Analyze the text, to determine its relevant features.
        const doc_data = analyze_document(doc_text);
        console.log(doc_data);

        _docs_data.set(doc_id, doc_data);
        console.log(_docs_data);

        // Update the inverted index.
        for (let [k, v] of doc_data.get("words")) {
            console.log(`\tfor loop - ${k}: ${typeof(k)} => ${v}: ${typeof(v)}`);

            let new_v = _inverted_index.get(k);
            if (new_v === undefined) { new_v = new Set(); }
            new_v.add(doc_id);

            _inverted_index.set(k, new_v);
        }

        console.log(_inverted_index);

        // Update the sum of lengths.
        _sum_length += doc_data.get("length");

        console.log(`\tInternal data updated`);
        console.log(`\t${_sum_length}`);

        res.sendStatus(200, `Document ${doc_id} created.`);
    }
    catch (error) {
        console.error(error);
    }
});


// Obtain the list of all documents.
app.get(`${BASE_URL}/docs`, (req, res) => {
    res.send({
        num_docs: _docs_data.size,
        docs_id: _docs_data.keys()
    });
});


// Obtain the text of an existing document.
app.get(`${BASE_URL}/docs/:doc_id`, (req, res) => {
    try {
        // Extract the input data from the request parameters.
        const doc_id = req.params.doc_id;

        console.log(`GET /docs/:doc_id: ${doc_id}`);
        //console.log(req);

        // Determine whether a document with the same id does already exist.
        if (!_docs_data.has(doc_id)){
            res.sendStatus(409, `The document ${doc_id} does not exist.`);
            return;
        }

        console.log("doc_text", _docs_data.get(doc_id).get("text"));

        /*
        result = new Map();
        result.set("doc_text:", _docs_data.get(doc_id).get("text"));
        res.send(result);
        */

        res.send({"doc_text": _docs_data.get(doc_id).get("text")});
    }
    catch (error) {
        console.error(error);
    }
});


// Update the text of an existing document.
app.put(`${BASE_URL}/docs/:doc_id`, (req, res) => {
    // Extract the input data from the request parameters.
    const doc_id = req.params.doc_id;
    const doc_text = req.params.doc_text;

    // Determine whether a document with the same id does already exist.
    if (!_docs_data.has(doc_id)){
        res.sendStatus(409, `The document ${doc_id} does not exist.`);
        return;
    }

    let old_doc_data = _docs_data.get(doc_id);
    let new_doc_data = analyze_document(doc_text);

    // Update the documents data.
    _docs_data.set(doc_id, new_doc_data);

    // Update the inverted index.
    let old_keys = Set(old_doc_data.words.keys());
    let new_keys = Set(new_doc_data.words.keys());

    let keys_to_remove = old_keys.difference(new_keys);
    let keys_to_add = new_keys.difference(old_keys);

    // Remove the current document from the posting list of all old words k
    // in the inverted index.
    for (let k of keys_to_remove) {
        let new_v = _inverted_index.get(k);
        new_v.delete(doc_id);

        _inverted_index.set(k, new_v);
    }

    // Add the current document to the posting list for all new words k
    // in the inverted index.
    for (let k of keys_to_add) {
        let new_v = _inverted_index.get(k);
        if (new_v === undefined) { new_v = new Set(); }
        new_v.add(doc_id);

        _inverted_index.set(k, new_v);
    }

    // Update the sum of lengths.
    _sum_length -= old_doc_data.length;
    _sum_length += new_doc_data.length;

    res.sendStatus(200, `Document ${doc_id} updated.`);
});


// Delete an existing document.
app.delete(`${BASE_URL}/docs/:doc_id`, (req, res) => {
    // Extract the input data from the request parameters.
    const doc_id = req.params.doc_id;

    // Determine whether a document with the same id does already exist.
    if (!_docs_data.has(doc_id)) {
        res.sendStatus(409, `The document ${doc_id} does not exist.`);
        return;
    }

    let old_doc_data = _docs_data.get(doc_id);

    // Update the documents data.
    _docs_data.delete(doc_id);

    // Update the inverted index.
    for (let [k, v] of old_doc_data.words) {
        let new_v = _inverted_index.get(k);
        new_v.delete(doc_id);

        _inverted_index.set(k, new_v);
    }

    // Update the sum of lengths.
    _sum_length -= old_doc_data.length;

    res.sendStatus(200, `Document ${doc_id} deleted.`);
});


// Perform search using BM25 scoring function.
app.get(`${BASE_URL}/search`, (req, res) => {
    console.log(req.query, JSON.stringify(req.query));

    // Extract the input data from the request body.
    const terms = req.query.query.split(";");
    const num_docs = req.query.num_docs;

    console.log(terms, terms.length, num_docs);

    console.log(`GET /search: ${terms} - ${num_docs}`)

    if (_docs_data.size == 0) {
        res.sendStatus(403, `The documents collection is empty.`);
        return;
    }

    console.log(`Inverted Index:`, _inverted_index, `\n\n`);

    // Determine the average length of documents.
    let avg_length = _sum_length / _docs_data.size;

    // Store the scores associated with the documents.
    let retrieval = new Map();

    for (let t of terms) {
        console.log(`\tterm: ${t}`);

        // Remove any useless character.
        t = t.replaceAll(SEP_REGEX, "");
        console.log(`\tterm: ${t}`);

        // Get the posting list associated with term t.
        const v = _inverted_index.get(t);
        if (v === undefined) { continue; }
        if (v.size == 0) { continue; }

        console.log(`\tterm: ${t} - Step 1`);
        console.log(`\tPosting list of ${t}`, v);

        // Compute the IDF part of the BM25 scoring.
        const score_idf = idf(v.size, _docs_data.size);

        console.log(`\tterm: ${t} - Step 2`);
        console.log(`\tIDF: ${score_idf}`);

        // Loop through each document in the posting list of term t.
        for (let doc_id of v) {
            const doc_data = _docs_data.get(doc_id);

            console.log(`\tterm: ${t} - Step 3.1`);
            console.log(`\tdoc_data:`, typeof(doc_data), doc_data, "\n");
            console.log(`\tdoc_data.words:`, typeof(doc_data.get("words")), doc_data.get("words"), "\n");
            console.log(`\tdoc_data.words.get(t):`, typeof(doc_data.get("words").get(t)), doc_data.get("words").get(t), "\n");

            // Compute the TF part of the BM25 scoring.
            const score_tf = tf(doc_data.get("words").get(t), doc_data.get("length"), avg_length);
            console.log(`\tTF: ${score_tf}`);
            const new_score = score_tf * score_idf;
            console.log(`\tnew_score: ${new_score}`);

            console.log(`\tterm: ${t} - Step 3.2`);

            // Find the partial score for the current document.
            let old_score = retrieval.get(doc_id);
            if (old_score === undefined) { old_score = 0.0; }
            console.log(`\told_score: ${old_score}`);

            console.log(`\tterm: ${t} - Step 3.3`);

            // Update the partial score of the current document.
            const score = old_score + new_score;
            console.log(`\tscore: ${score}`);
            if (score > 0.0) {
                retrieval.set(doc_id, score);
            }

            console.log(`\tterm: ${t} - Step 3.4`);
            console.log(`\tretrieval:`, retrieval);
        }
    }

    console.log(`\tRetrieval performed:\n`, retrieval, `\n\n`)

    // Sort the result map by score in descending order,
    // then keep only the top-k best documents.
    retrieval = Array.from(retrieval).sort((x, y) => y[1] - x[1]);
    console.log(`\tSorting performed`);
    console.log(retrieval);
    console.log(typeof(retrieval));

    let num_result = retrieval.length;
    if (num_result > num_docs) { num_result = num_docs; }

    //const docs_result = new Map();
    const docs_result = {};
    for (let i = 0; i < num_result; i += 1) {
        const _k = retrieval[i][0];
        const _v = retrieval[i][1];
        console.log("- ", i, ": ", _k, "=>", _v);

        //docs_result.set(_k, _v);
        docs_result[_k] = _v;
    }

    /*
    const result = new Map();
    result.set("num_results", num_result);
    result.set("docs", docs_result);
    res.send(result);
    */

    res.send({"num_results": num_result, "docs": docs_result});
});


// Let the app listen for requests at port PORT.
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});