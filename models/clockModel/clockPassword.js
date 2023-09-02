const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const getDB = require('../dbSingleton');

const setPasswordForClock = async (password) => {
    try {
        if (typeof password !== 'string') {
            throw 'Invalid input: password must be a string';
        }
        const passwordHash = await bcrypt.hash(password, 10);
        return { passwordHash };
        // return await updateClockById(id, { passwordHash });
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const isPasswordSet = async (id) => {
    const db = await getDB();
    const clock = await db.collection('clocks').findOne(
        { _id: new ObjectId(id) },
        { projection: { passwordHash: 1 } }
    );
    return clock ? Boolean(clock.passwordHash) : false;
};

module.exports = {
  setPasswordForClock,
  isPasswordSet
};
