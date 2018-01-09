(async function () {
  const db = new Dexie(DB_NAME);
  db.version(DB_VERSION).stores({
    [STORE_NAME]: `${STORE_KEY_PATH}, url`,
  });
  db.open().catch((e) => {
    console.error(`Error while opening DB "${DB_NAME}"`);
  });

  const count = await db[STORE_NAME].count();
  if (count > 0) {
    console.log(`Skipping data fetch because ${count} records were found`);
  } else {
    console.log('Fetching data because no records were found');
    try {
      const response = await fetch(GET_URI);
      const json = await response.json();
      await db.transaction('rw', STORE_NAME, () => {
        return db[STORE_NAME].bulkAdd(json.results);
      });
    } catch (e) {
      console.log(`Error while fetching data`);
    }
  }

  const records = await db[STORE_NAME].toArray();
  renderList(records);
})();