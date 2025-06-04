document.addEventListener('DOMContentLoaded', () => {
    const add_btn = document.getElementById('add_btn');
    const get_btn = document.getElementById('get_btn');
    const search_btn = document.getElementById('search_btn');

    const error_div = document.getElementById('error');


    add_btn.addEventListener('click', add_document);
    get_btn.addEventListener('click', get_document);
    search_btn.addEventListener('click', perform_search);


    const BASE_URL = "https://biss25-rest.onrender.com";


    function showError(message) {
        error_div.textContent = message;
        error_div.classList.remove('hidden');
    }

    async function add_document() {
        error_div.classList.add('hidden');

        const doc_id = document.getElementById("add_doc_id").textContent;
        const doc_text = document.getElementById("add_doc_text").textContent;
        
        console.log(`add_document(): ${doc_id} = ${doc_text}`);

        const response = await fetch(BASE_URL + '/docs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                doc_id,
                doc_text
            })
        });

        console.log(`\tfetch() called`);

        const data = await response.json();

        console.log(`\tresponse: ${data}`);

        if (response.ok) {
            console.log(`\tAdd Document ${doc_id} Performed Successfully!`);

            const add_doc_result = document.getElementById("add_doc_result");
            add_doc_result.textContent = `Add Document ${doc_id} Performed Successfully!`;
        } else {
            console.log(`\tError: ${data.error || `Unknown error`}`);
            showError(data.error || 'Unknown error');
            // throw new Error(data.error || 'Unknown error');
        }
    }


    async function get_document() {
        error_div.classList.add('hidden');

        const doc_id = document.getElementById("get_doc_id").textContent;

        console.log(`get_document(): ${doc_id}`);

        const response = await get(BASE_URL + '/doc/:doc_id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                doc_id
            })
        });

        console.log(`\tfetch() called`);

        const data = await response.json();

        console.log(`\tresponse: ${data}`);

        if (response.ok) {
            console.log(`\tGet Document ${doc_id} Performed Successfully!`);

            const get_doc_text = document.getElementById("get_doc_text");
            get_doc_text.textContent = data.doc_text;
        } else {
            console.log(`\tError: ${data.error || `Unknown error`}`);
            showError(data.error || 'Unknown error');
            // throw new Error(data.error || 'Unknown error');
        }
    }


    async function perform_search() {
        error_div.classList.add('hidden');

        const flag1 = document.getElementById("chb_search_term_1").checked;
        const flag2 = document.getElementById("chb_search_term_2").checked;
        const flag3 = document.getElementById("chb_search_term_3").checked;
        const flag4 = document.getElementById("chb_search_term_4").checked;
        const term1 = document.getElementById("text_search_term_1").textContent;
        const term2 = document.getElementById("text_search_term_2").textContent;
        const term3 = document.getElementById("text_search_term_3").textContent;
        const term4 = document.getElementById("text_search_term_4").textContent;

        let terms = "";
        if (flag1) { terms = `${terms};${term1}`; }
        if (flag2) { terms = `${terms};${term2}`; }
        if (flag3) { terms = `${terms};${term3}`; }
        if (flag4) { terms = `${terms};${term4}`; }
        terms = terms.slice(1, terms.length);

        const num_docs = 5;

        console.log(`perform_search(): ${terms}`);

        const response = await get(BASE_URL + '/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                terms,
                num_docs
            })
        });

        console.log(`\tfetch() called`);

        const data = await response.json();

        console.log(`\tresponse: ${data}`);

        if (response.ok) {
            console.log(`\tSearch Performed Successfully!`);

            const id_result_1 = document.getElementById('id_result_1');
            const id_result_2 = document.getElementById('id_result_2');
            const id_result_3 = document.getElementById('id_result_3');
            const id_result_4 = document.getElementById('id_result_4');
            const id_result_5 = document.getElementById('id_result_5');
            const score_result_1 = document.getElementById('score_result_1');
            const score_result_2 = document.getElementById('score_result_2');
            const score_result_3 = document.getElementById('score_result_3');
            const score_result_4 = document.getElementById('score_result_4');
            const score_result_5 = document.getElementById('score_result_5');

            if (data.num_results >= 1) {
                id_result_1.textContent = data.docs[0][0];
                score_result_1.textContent = data.docs[0][1];
            }
            if (data.num_results >= 2) {
                id_result_2.textContent = data.docs[1][0];
                score_result_2.textContent = data.docs[1][1];
            }
            if (data.num_results >= 3) {
                id_result_3.textContent = data.docs[2][0];
                score_result_3.textContent = data.docs[2][1];
            }
            if (data.num_results >= 4) {
                id_result_4.textContent = data.docs[3][0];
                score_result_4.textContent = data.docs[3][1];
            }
            if (data.num_results >= 5) {
                id_result_5.textContent = data.docs[4][0];
                score_result_5.textContent = data.docs[4][1];
            }
        } else {
            console.log(`\tError: ${data.error || `Unknown error`}`);
            showError(data.error || 'Unknown error');
            // throw new Error(data.error || 'Unknown error');
        }
    }
});