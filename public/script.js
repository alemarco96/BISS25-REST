document.addEventListener('DOMContentLoaded', () => {
    const add_btn = document.getElementById('add_btn');
    const get_btn = document.getElementById('get_btn');
    const search_btn = document.getElementById('search_btn');

    const error_tb = document.getElementById('error_message');


    add_btn.addEventListener('click', add_document);
    get_btn.addEventListener('click', get_document);
    search_btn.addEventListener('click', perform_search);


    const BASE_URL = "https://biss25-rest.onrender.com/api/v1";


    function showError(message) {
        error_tb.value = message;
    }


    async function add_document() {
        try {
            console.info("**************************************************");
            console.info("script.js: START add_document()");

            error_tb.value = ``;

            const doc_id = document.getElementById("add_doc_id").value;
            const doc_text = document.getElementById("add_doc_text").value;        
            console.log(`- doc_id:`, doc_id);
            console.log(`- doc_text:`, doc_text);

            const response = await fetch(`${BASE_URL}/docs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    doc_id,
                    doc_text
                })
            });
            console.log(`- fetch() called:`, response.status, response.statusText);

            if (response.ok) {
                console.log(`- Add Document ${doc_id} Performed Successfully!`);
                document.getElementById("add_doc_result").value = `OK!`;
            
                console.info("script.js: END add_document()");
                console.info("**************************************************");
            } else {
                document.getElementById("add_doc_result").value = `No :(`;
                throw new Error(`Add Document ${doc_id} has failed...`);
            }
        }
        catch (error) {
            console.error(error);
            showError(error);

            console.info("script.js: END add_document()");
            console.info("**************************************************");
        }
    }


    async function get_document() {
        try {
            console.info("**************************************************");
            console.info("script.js: START get_document()");

            error_tb.value = ``;
            document.getElementById("get_doc_text").value = ``;

            const doc_id = document.getElementById("get_doc_id").value;
            console.log(`- doc_id: `, doc_id);

            const response = await fetch(`${BASE_URL}/docs/${doc_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                params: JSON.stringify({
                    doc_id
                })
            });
            console.log(`- fetch() called:`, response.status, response.statusText);

            if (response.ok) {
                console.log(`\tGet Document ${doc_id} Performed Successfully!`);

                const data = await response.json();
                console.log(typeof(data), data);
                //console.log(data.keys());
                //console.log(data.doc_text);
                console.log(data["doc_text"]);
                document.getElementById("get_doc_text").value = data["doc_text"];

                console.info("script.js: END get_document()");
                console.info("**************************************************");
            } else {
                console.info();
                throw new Error(`Get Document ${doc_id} has failed...`);
            }
        }
        catch (error) {
            console.error(error);
            showError(error);

            console.info("script.js: END get_document()");
            console.info("**************************************************");
        }
    }


    async function perform_search() {
        try {
            console.info("**************************************************");
            console.info("script.js: START perform_search()");

            error_tb.value = ``;
            document.getElementById("id_result_1").value = ``;
            document.getElementById("score_result_1").value = ``;
            document.getElementById("id_result_2").value = ``;
            document.getElementById("score_result_2").value = ``;
            document.getElementById("id_result_3").value = ``;
            document.getElementById("score_result_3").value = ``;
            document.getElementById("id_result_4").value = ``;
            document.getElementById("score_result_4").value = ``;
            document.getElementById("id_result_5").value = ``;
            document.getElementById("score_result_5").value = ``;

            const flag1 = document.getElementById("chb_search_term_1").checked;
            const flag2 = document.getElementById("chb_search_term_2").checked;
            const flag3 = document.getElementById("chb_search_term_3").checked;
            const flag4 = document.getElementById("chb_search_term_4").checked;
            const term1 = document.getElementById("text_search_term_1").value;
            const term2 = document.getElementById("text_search_term_2").value;
            const term3 = document.getElementById("text_search_term_3").value;
            const term4 = document.getElementById("text_search_term_4").value;

            let terms = "";
            if (flag1) { terms = `${terms};${term1}`; }
            if (flag2) { terms = `${terms};${term2}`; }
            if (flag3) { terms = `${terms};${term3}`; }
            if (flag4) { terms = `${terms};${term4}`; }
            terms = terms.slice(1, terms.length);

            const num_docs = 5;

            console.log(`- terms:`, terms);

            const response = await fetch(`${BASE_URL}/search?query=${terms}&num_docs=${num_docs}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log(`- fetch() called:`, response.status, response.statusText);

            if (response.ok) {
                console.log(`- Search Performed Successfully!`);

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

                const data = await response.json();
                console.log(`- response.json():`, data);
                console.log(`- response data:`, data.num_results, data.docs);
                if (data.num_results >= 1) {
                    id_result_1.value = data.docs[0][0];
                    score_result_1.value = data.docs[0][1];
                }
                if (data.num_results >= 2) {
                    id_result_2.value = data.docs[1][0];
                    score_result_2.value = data.docs[1][1];
                }
                if (data.num_results >= 3) {
                    id_result_3.value = data.docs[2][0];
                    score_result_3.value = data.docs[2][1];
                }
                if (data.num_results >= 4) {
                    id_result_4.value = data.docs[3][0];
                    score_result_4.value = data.docs[3][1];
                }
                if (data.num_results >= 5) {
                    id_result_5.value = data.docs[4][0];
                    score_result_5.value = data.docs[4][1];
                }

                console.info("script.js: END perform_search()");
                console.info("**************************************************");
            } else {
                throw new Error(`Perform search has failed...`);
            }
        }
        catch (error) {
            console.error(error);
            showError(error);

            console.info("script.js: END perform_search()");
            console.info("**************************************************");
        }
    }
});