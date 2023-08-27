const { ObjectId } = require('mongodb');
const getDB = require('../dbSingleton');

const updateClocksInBatch = async (updates) => {
    const db = await getDB();
    
    // Use map instead of a for loop to construct bulkOps
    const bulkOps = updates.map(({id, ...fieldsToUpdate}) => ({
        updateOne: {
            filter: { _id: new ObjectId(id) },
            update: { $set: fieldsToUpdate }
        }
    }));

    if (bulkOps.length > 0) {
        await db.collection('clocks').bulkWrite(bulkOps);
    }
};

module.exports = {
  updateClocksInBatch
};
