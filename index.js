// Reference: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
(async function () {
  let db = null;
  try {
    db = await openDB(DB_NAME, DB_VERSION, (event) => {
      createObjectStore(event.target.result, STORE_NAME, STORE_KEY_PATH);
      console.log(`Successfully created object store "${STORE_NAME}"`);
    });
  } catch (e) {
    console.error(`Error while opening DB "${DB_NAME}"`);
  }

  const count = await transaction(db, STORE_NAME, null, countRecords);
  if (count > 0) {
    console.log(`Skipping data fetch because ${count} records were found`);
  } else {
    console.log('Fetching data because no records were found');
    try {
      const response = await fetch(GET_URI);
      const json = await response.json();
      await transaction(db, STORE_NAME, 'readwrite', (store) => {
        json.results.forEach((p) => {
          store.add(p);
        });
      });
    } catch (e) {
      console.log(`Error while fetching data`);
    }
  }

  const records = await transaction(db, STORE_NAME, null, getAllRecords);
  renderList(records);


  function countRecords(store) {
    return promisifyIDBRequest(() => store.count());
  }


  function createObjectStore(db, name, keyPath) {
    db.createObjectStore(name, { keyPath });
  }


  function getAllRecords(store) {
    return promisifyIDBRequest(() => store.getAll());
  }


  function openDB(name, version, onupgradeneeded) {
    return promisifyIDBRequest(
      () => window.indexedDB.open(name, version),
      (request) => {
        request.onupgradeneeded = onupgradeneeded;
      }
    );
  }


  function promisifyIDBRequest(makeRequest, extras) {
    return new Promise((resolve, reject) => {
      const request = makeRequest();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      extras && extras(request);
    })
  }


  function transaction(db, storeName, mode, doWork) {
    return new Promise(async (resolve, reject) => {
      const t = db.transaction([storeName], mode || 'readonly');
      t.onerror = reject;

      const store = t.objectStore(storeName);
      const returnValue = await doWork(store);
      t.oncomplete = () => resolve(returnValue);
    });
  }
})();
